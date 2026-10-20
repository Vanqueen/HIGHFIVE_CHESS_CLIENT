import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store/store";

export interface CounterState {
  value: number;
}

type CounterRootState = RootState & { counter: CounterState };

const initialState: CounterState = {
  value: 0,
} satisfies CounterState as CounterState;

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

export const selectCount = (state: RootState) => (state as CounterRootState).counter.value;

export default counterSlice.reducer;
