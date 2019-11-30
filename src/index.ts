import * as React from "react";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import useForceUpdate from "use-force-update";
import { switchMap, takeUntil } from "rxjs/operators";

type Selector<T, O extends Observable<T>> = O | (() => O);

interface RefValue<T> {
  unsubscribe$: Subject<unknown>;
  value$: BehaviorSubject<T | null>;
}

function useRxJs<T>(
  observableSelector: Selector<T, BehaviorSubject<T>>
): T;

function useRxJs<T>(
  observableSelector: Selector<T, Observable<T>>
): T | null;

function useRxJs<T>(
  observableSelector: Selector<T, BehaviorSubject<T> | Observable<T>>
): T | null {
  const ref = React.useRef<RefValue<T> | null>(null);
  const forceUpdate = useForceUpdate();

  const externalValue$ =
    typeof observableSelector === "function"
      ? useInstance(observableSelector)
      : observableSelector;

  const external$ = useInstance(() => new BehaviorSubject(externalValue$));

  if (ref.current === null) {
    const unsubscribe$ = new Subject<unknown>();
    const value$ = new BehaviorSubject<T | null>(null);

    external$
      .pipe(
        switchMap(externalValue$ => externalValue$!),
        takeUntil(unsubscribe$)
      )
      .subscribe(value => value$.next(value));

    ref.current = {
      unsubscribe$,
      value$
    };
  }

  React.useEffect(() => {
    if (externalValue$ !== external$.value) {
      external$.next(externalValue$);
    }
  });

  React.useEffect(() => {
    const { unsubscribe$ } = ref.current as RefValue<T>;

    let isInitialUpdate = true;

    external$
      .pipe(
        switchMap(externalValue$ => externalValue$),
        takeUntil(unsubscribe$)
      )
      .subscribe(() => {
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

type InstanceFactory<T> = () => T;

export function useInstance<T>(initializer: InstanceFactory<T>): T {
  const instanceRef = React.useRef<T | null>(null);

  if (instanceRef.current === null) {
    instanceRef.current = initializer();
  }

  return instanceRef.current;
}

export default useRxJs;