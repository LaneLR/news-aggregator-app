import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false, 
}

const manageLoggedInSlice = createSlice({
  name: "manageLoggedIn", 
  initialState,
  reducers: {
    setLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
    toggleLoggedIn: (state) => {
      state.isLoggedIn = !state.isLoggedIn;
    },
  }
});

export const { setLoggedIn, toggleLoggedIn } = manageLoggedInSlice.actions;
export default manageLoggedInSlice.reducer;