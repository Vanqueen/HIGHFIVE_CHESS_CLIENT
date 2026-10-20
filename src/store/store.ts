import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counterSlice'
import authReducer from "../features/authSlice.tsx";

export const store = configureStore({
  reducer: {
    auth: authReducer.reducer,
    counter: counterReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
