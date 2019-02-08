import * as React from "react";
import { Observable, Subscription } from "rxjs";
import useForceUpdate from "use-force-update";

type ObservableSelector<T> = Observable<T> | (() => Observable<T>);

export default function useRxJs<T>(
  observableSelector: ObservableSelector<T>
): T | null {
  const forceUpdate = useForceUpdate();
  const observerRef = React.useRef<Observable<T> | null>(null);
  const subscriptionRef = React.useRef<Subscription | null>(null);
  const valueRef = React.useRef<T | null>(null);

  if (observerRef.current === null) {
    const value$ =
      typeof observableSelector === "function"
        ? observableSelector()
        : observableSelector;

    const subscription = value$.subscribe(nextValue => {
      valueRef.current = nextValue;
      forceUpdate();
    });

    observerRef.current = value$;
    subscriptionRef.current = subscription;
  }

  return valueRef.current;
}
