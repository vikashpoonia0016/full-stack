import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PlatformState {
  name: string;
  theme: string;
}

const initialState: PlatformState = {
  name: 'Web',
  theme: 'dark',
};

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    setPlatform: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
  },
});

export const { setPlatform, setTheme } = platformSlice.actions;
export default platformSlice.reducer;
