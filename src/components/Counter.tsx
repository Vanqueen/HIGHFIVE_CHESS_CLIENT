import { useAppDispatch, useAppSelector } from "../app/hooks";
import { decrement, increment } from "../features/counterSlice";

export default function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  function handleClick(value: string) {
    // const incrementID = document.getElementById("increment");
    if (value === "increment") {
      dispatch(increment());
      // incrementID.innerHTML = `Count: ${count + 1}`;
      console.log("increment :", count);
    } else {
      console.log("decrement");
      dispatch(decrement());
      console.log("decrement :", count);
    }
  }
  return (
    <div>
      <h1>Counter</h1>
      <div>
        <button
          type="button"
          id="increment"
          aria-label="Increment value"
          onClick={() => handleClick("increment")}
        >
          Increment
        </button>
        <span>{count}</span>
        <button
          type="button"
          id="decrement"
          aria-label="Decrement value"
          onClick={() => handleClick("decrement")}
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
