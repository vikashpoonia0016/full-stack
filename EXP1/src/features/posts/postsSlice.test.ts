import reducer, { addPost, toggleLike, removePost } from './postsSlice';

describe('posts slice', () => {
  it('adds a post into the normalized state', () => {
    const state = reducer(undefined, addPost({ id: 3, title: 'Draft post', body: 'Ready to publish', likes: 0, platform: 'Mobile' }));

    expect(state.byId[3]).toEqual({ id: 3, title: 'Draft post', body: 'Ready to publish', likes: 0, platform: 'Mobile' });
    expect(state.allIds).toContain(3);
  });

  it('increments likes and removes a post', () => {
    const state = reducer(
      {
        byId: {
          1: { id: 1, title: 'First', body: 'Body', likes: 1, platform: 'Web' },
        },
        allIds: [1],
      },
      toggleLike(1)
    );

    expect(state.byId[1].likes).toBe(2);

    const removed = reducer(state, removePost(1));
    expect(removed.byId[1]).toBeUndefined();
    expect(removed.allIds).toEqual([]);
  });
});
