"use client";
import createSagaMiddleware from "redux-saga";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import rootSaga from "./app/sagas";
import LoggedInReducer from "./app/slices/manageLoggedIn";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    manageLoggedIn: LoggedInReducer,
  },
  middleware: (getDefaultMiddleWare) =>
    getDefaultMiddleWare({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default function Providers({ children }) {
  return (
    <>
      <Provider store={store}>{children}</Provider>
    </>
  );
}
