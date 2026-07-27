import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface DraftState {
  title: string;
  body: string;
  platform: string;
}

const initialState: DraftState = {
  title: '',
  body: '',
  platform: 'Web',
};

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    updateDraft: (state, action: PayloadAction<Partial<DraftState>>) => {
      return { ...state, ...action.payload };
    },
    resetDraft: () => initialState,
  },
});

export const { updateDraft, resetDraft } = draftsSlice.actions;
export default draftsSlice.reducer;
