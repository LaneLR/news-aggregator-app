"use client";
import createSagaMiddleware from "redux-saga";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import rootSaga from "./app/sagas";
import { useEffect } from "react";
import LoggedInReducer from "./app/slices/manageLoggedIn";
import { loginUser, logoutUser } from "./app/slices/manageLoggedIn"; 


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
  const dispatch = store.dispatch; 

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth-status"); 
        const data = await res.json();

        if (data.isLoggedIn) {
          //if server says user is logged in, update Redux state
          dispatch(loginUser({ user: data.user, status: "active" }));
        } else {
          //if not logged in, ensure Redux state reflects it
          dispatch(logoutUser());
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        dispatch(logoutUser()); //ensure user logged out if error
      }
    };

    checkAuthStatus();
  }, [dispatch]); 

  return (
    <>
      <Provider store={store}>{children}</Provider>
    </>
  );
}
