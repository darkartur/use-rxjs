import * as React from "react";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import useForceUpdate from "use-force-update";
import { takeUntil } from "rxjs/operators";

type Selector<T, O extends Observable<T>> = O | (() => O);

interface RefValue<T> {
  unsubscribe$: Subject<unknown>;
  value$: BehaviorSubject<T | null>;
}

export default function useRxJs<T>(observableSelector: Selector<T, BehaviorSubject<T>>): T;

export default function useRxJs<T>(observableSelector: Selector<T, Observable<T>>): T | null;

export default function useRxJs<T>(
  observableSelector: Selector<T, BehaviorSubject<T> | Observable<T>>
): T | null {
  const ref = React.useRef<RefValue<T> | null>(null);
  const forceUpdate = useForceUpdate();

  if (ref.current === null) {
    const unsubscribe$ = new Subject<unknown>();
    const value$ = new BehaviorSubject<T | null>(null);
    const observable$ =
      typeof observableSelector === "function"
        ? observableSelector()
        : observableSelector;

    observable$
      .pipe(takeUntil(unsubscribe$))
      .subscribe(value => value$.next(value));

    ref.current = {
      unsubscribe$,
      value$
    };
  }

  React.useEffect(() => {
    const { unsubscribe$, value$ } = ref.current as RefValue<T>;

    let isInitialUpdate = true;

    value$.pipe(takeUntil(unsubscribe$)).subscribe(() => {
      if (!isInitialUpdate) {
        forceUpdate();
      }
    });

    isInitialUpdate = false;

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
  }, []);

  return (ref.current as RefValue<T>).value$.getValue();
}