import * as React from "react";
import { mount, configure } from "enzyme";
import { act } from "react-dom/test-utils";
import * as Adapter from "enzyme-adapter-react-16";
import useRxJs from "./index";
import { BehaviorSubject, Observable } from "rxjs";

configure({ adapter: new Adapter() });

describe("useRxJs", () => {
  test("should render only once during BehaviorSubject init", () => {
    const subject$ = new BehaviorSubject("test");
    let renderCount = 0;

    function Component() {
      renderCount++;
      useRxJs(subject$);
      return <div />;
    }

    mount(<Component />);

    expect(renderCount).toBe(1);
  });

  test("should grab initial value from BehaviorSubject", () => {
    const expectedValue = "test";
    const subject$ = new BehaviorSubject(expectedValue);
    let actualValue: string;

    function Component() {
      actualValue = useRxJs(subject$);
      return <div />;
    }

    mount(<Component />);

    expect(actualValue!).toBe(expectedValue);
  });

  test("should grab BehaviorSubject updates", () => {
    const subject$ = new BehaviorSubject(1);
    let actualValue: number;

    function Component() {
      actualValue = useRxJs(subject$);
      return <div />;
    }

    mount(<Component />);
    expect(actualValue!).toBe(1);

    act(() => subject$.next(2));
    expect(actualValue!).toBe(2);

    act(() => subject$.next(3));
    expect(actualValue!).toBe(3);
  });

  test("should change value source when observable changes", () => {
    const subject1$ = new BehaviorSubject(1);
    const subject2$ = new BehaviorSubject(2);
    let actualValue: number;

    function Component({ subject$ }: { subject$: BehaviorSubject<number> }) {
      actualValue = useRxJs(subject$);
      return <div />;
    }

    const wrapper = mount(<Component subject$={subject1$} />);

    wrapper.setProps({
      subject$: subject2$
    });

    expect(actualValue!).toBe(2);
  });

  test("should subscribe only once", () => {
    // let next: () => void;
    let subscribeCount = 0;
    const value$ = new Observable<string>(observer => {
      subscribeCount++;
      observer.next("test");
      // next = () => observer.next('test');
    });

    function Component() {
      useRxJs(value$);
      return <div />;
    }

    mount(<Component />);
    expect(subscribeCount).toBe(1);
  });
});
