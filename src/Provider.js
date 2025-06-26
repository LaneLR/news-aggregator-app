"use client";
import createSagaMiddleware from "redux-saga";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import rootSaga from "./app/sagas";
import { useEffect, useState } from "react";
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
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth-status"); 
        const data = await res.json();

        if (data.isLoggedIn) {
          //if server says user is logged in, update Redux state
          dispatch(loginUser({ user: data.user, status: "active" }));
          setLoadingAuth(false)
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
      <Provider store={store}>{loadingAuth ? <div style={{fontSize: '3rem', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading feed...</div> : children}</Provider>
    </>
  );
}
