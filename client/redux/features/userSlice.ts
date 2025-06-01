import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ProfileType } from "@/types/login";

interface UserState {
  user: ProfileType | null;
}

const initialState: UserState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const selectUser = (state: RootState) => state.user.user;
export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
