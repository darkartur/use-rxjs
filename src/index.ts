import * as React from "react";
import { BehaviorSubject, Observable } from "rxjs";
import useForceUpdate from "use-force-update";
import { useEffect, useRef } from "react";

type Selector<T, O extends Observable<T>> = O | (() => O);

function useRxJs<T>(observableSelector: Selector<T, BehaviorSubject<T>>): T;

function useRxJs<T>(observableSelector: Selector<T, Observable<T>>): T | null;

function useRxJs<T>(
  observableSelector: Selector<T, BehaviorSubject<T> | Observable<T>>
): T | null {
  const value$ = useObservableSelector(observableSelector);
  const valueRef = useRef<T | null>(null);
  const forceUpdate = useForceUpdate();
  const isFirstRenderRef = useIsFirstRenderRef();

  const subscribe = () =>
    value$.subscribe(value => {
      valueRef.current = value;
      if (!isFirstRenderRef.current) {
        forceUpdate();
      }
    });

  const initialSub = isFirstRenderRef.current && subscribe();

  useEffect(() => {
    const sub = initialSub || subscribe();

    return () => sub.unsubscribe();
  }, [value$]);

  return valueRef.current;
}

function useObservableSelector<T>(
  observableSelector: Selector<T, BehaviorSubject<T> | Observable<T>>
) {
  return typeof observableSelector === "function"
    ? useInstance(observableSelector)
    : observableSelector;
}

type InstanceFactory<T> = () => T;

export function useInstance<T>(initializer: InstanceFactory<T>): T {
  const instanceRef = React.useRef<T | null>(null);

  if (instanceRef.current === null) {
    instanceRef.current = initializer();
  }

  return instanceRef.current;
}

function useIsFirstRenderRef() {
  const ref = React.useRef(true);

  useEffect(() => {
    ref.current = false;
  }, []);

  return ref;
}

export default useRxJs;

export { useRxJs };
