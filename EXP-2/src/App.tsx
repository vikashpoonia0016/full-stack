import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './app/store';
import { addPost, toggleLike, removePost } from './features/posts/postsSlice';
import { setPlatform, setTheme } from './features/platform/platformSlice';
import { resetDraft, updateDraft } from './features/drafts/draftsSlice';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const posts = useSelector((state: RootState) => state.posts.allIds.map((id) => state.posts.byId[id]));
  const platform = useSelector((state: RootState) => state.platform);
  const draft = useSelector((state: RootState) => state.drafts);

  const handlePublish = () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    const id = Date.now();
    dispatch(addPost({ id, title: draft.title.trim(), body: draft.body.trim(), likes: 0, platform: draft.platform }));
    dispatch(resetDraft());
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Experiment 2</p>
          <h1>Centralized State Management with Redux Toolkit</h1>
          <p>Posts, platform preferences, and drafts are handled through a single global store.</p>
        </div>
        <div className="controls">
          <label>
            Platform
            <select value={platform.name} onChange={(e) => dispatch(setPlatform(e.target.value))}>
              <option value="Web">Web</option>
              <option value="Mobile">Mobile</option>
              <option value="Desktop">Desktop</option>
            </select>
          </label>
          <label>
            Theme
            <select value={platform.theme} onChange={(e) => dispatch(setTheme(e.target.value))}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </header>

      <section className="panel composer">
        <h2>Create Draft</h2>
        <input
          value={draft.title}
          onChange={(e) => dispatch(updateDraft({ title: e.target.value }))}
          placeholder="Post title"
        />
        <textarea
          value={draft.body}
          onChange={(e) => dispatch(updateDraft({ body: e.target.value }))}
          placeholder="Write your post content"
        />
        <select value={draft.platform} onChange={(e) => dispatch(updateDraft({ platform: e.target.value }))}>
          <option value="Web">Web</option>
          <option value="Mobile">Mobile</option>
          <option value="Desktop">Desktop</option>
        </select>
        <button onClick={handlePublish}>Publish Post</button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Published Posts</h2>
          <span>{posts.length} posts</span>
        </div>
        <div className="post-list">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <div>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
                <small>Target platform: {post.platform}</small>
              </div>
              <div className="post-actions">
                <span>{post.likes} likes</span>
                <button onClick={() => dispatch(toggleLike(post.id))}>Like</button>
                <button onClick={() => dispatch(removePost(post.id))}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stats">
        <div>
          <h3>Current platform</h3>
          <p>{platform.name}</p>
        </div>
        <div>
          <h3>Theme</h3>
          <p>{platform.theme}</p>
        </div>
        <div>
          <h3>Draft status</h3>
          <p>{draft.title ? 'Ready to publish' : 'Empty draft'}</p>
        </div>
      </section>
    </div>
  );
}

export default App;
