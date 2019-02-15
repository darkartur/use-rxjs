import * as React from "react";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import useForceUpdate from "use-force-update";
import { takeUntil } from "rxjs/operators";

type ObservableSelector<T> = Observable<T> | (() => Observable<T>);

interface RefValue<T> {
  unsubscribe$: Subject<unknown>;
  value$: BehaviorSubject<T | null>;
}

export default function useRxJs<T>(
  observableSelector: ObservableSelector<T>
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

    value$.pipe(takeUntil(unsubscribe$)).subscribe(forceUpdate);

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
  }, []);

  return (ref.current as RefValue<T>).value$.getValue();
}
