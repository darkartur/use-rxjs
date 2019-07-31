import * as React from "react";
import { mount, configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import useRxJs from "./index";
import { BehaviorSubject } from "rxjs";

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
});
