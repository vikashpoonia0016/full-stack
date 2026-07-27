import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Post {
  id: number;
  title: string;
  body: string;
  likes: number;
  platform: string;
}

interface PostsState {
  byId: Record<number, Post>;
  allIds: number[];
}

const initialState: PostsState = {
  byId: {
    1: { id: 1, title: 'Welcome', body: 'This is your first centralized post.', likes: 3, platform: 'Web' },
    2: { id: 2, title: 'Redux Toolkit', body: 'Structured state makes apps scalable.', likes: 2, platform: 'Mobile' },
  },
  allIds: [1, 2],
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<Post>) => {
      state.byId[action.payload.id] = action.payload;
      state.allIds.push(action.payload.id);
    },
    toggleLike: (state, action: PayloadAction<number>) => {
      const post = state.byId[action.payload];
      if (post) {
        post.likes += 1;
      }
    },
    removePost: (state, action: PayloadAction<number>) => {
      delete state.byId[action.payload];
      state.allIds = state.allIds.filter((id) => id !== action.payload);
    },
  },
});

export const { addPost, toggleLike, removePost } = postsSlice.actions;
export default postsSlice.reducer;
