import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const JWT_SECRET = 'jwt-demo-secret-key-2026'
const TOKEN_KEY = 'jwt_demo_token'

const roleAccessMap = {
  admin: ['admin', 'editor', 'viewer'],
  editor: ['editor', 'viewer'],
  viewer: ['viewer'],
}

const initialUsers = [
  { id: 'u-101', name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
  { id: 'u-202', name: 'Editor User', email: 'editor@demo.com', password: 'editor123', role: 'editor' },
  { id: 'u-303', name: 'Viewer User', email: 'viewer@demo.com', password: 'viewer123', role: 'viewer' },
  { id: 'u-404', name: 'Sarah Smith', email: 'sarah@demo.com', password: 'demo123', role: 'viewer' },
]

const initialPosts = [
  { id: 'p-1', title: 'Quarterly Product Update', content: 'The product team shipped improved performance and secure login checks.', author: 'Admin User', role: 'admin' },
  { id: 'p-2', title: 'Content Review Checklist', content: 'Editors should verify grammar, metadata, and user permissions before publishing.', author: 'Editor User', role: 'editor' },
  { id: 'p-3', title: 'Public Release Notes', content: 'The latest report is now available to all viewers for audit and review.', author: 'Viewer User', role: 'viewer' },
]

function base64UrlEncode(value) {
  const bytes =
    typeof value === 'string'
      ? new TextEncoder().encode(value)
      : value instanceof Uint8Array
        ? value
        : new TextEncoder().encode(JSON.stringify(value))

  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function createJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput))
  const encodedSignature = base64UrlEncode(new Uint8Array(signature))

  return `${signingInput}.${encodedSignature}`
}

async function verifyToken(token, secret) {
  if (!token) {
    return { valid: false, message: 'No token found.' }
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return { valid: false, message: 'Malformed JWT token.' }
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const signatureBytes = base64UrlDecode(encodedSignature)
  const isValidSignature = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(signingInput),
  )

  if (!isValidSignature) {
    return { valid: false, message: 'Token signature is invalid.' }
  }

  const payloadBytes = base64UrlDecode(encodedPayload)
  const payloadString = new TextDecoder().decode(payloadBytes)
  const payload = JSON.parse(payloadString)

  if (payload.exp && Date.now() > payload.exp * 1000) {
    return { valid: false, message: 'Token expired.' }
  }

  return { valid: true, payload }
}

function canAccessRole(userRole, routeRole) {
  const allowedRoles = roleAccessMap[userRole] ?? []
  return allowedRoles.includes(routeRole)
}

function ProtectedRoute({ session, allowedRoles, children }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

function LoginPage({ session, form, setForm, onLogin, error, isLoading }) {
  if (session) {
    return <Navigate to={session.user.role === 'admin' ? '/admin' : session.user.role === 'editor' ? '/editor' : '/viewer'} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  return (
    <div className="auth-shell">
      <div className="auth-card login-card">
        <p className="eyebrow">Role-Based Access Control</p>
        <h1>Secure Login</h1>

        <form className="login-form" onSubmit={onLogin}>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>

          <div className="demo-credentials">
            <p>Use one of these roles:</p>
            <span>admin@demo.com / admin123</span>
            <span>editor@demo.com / editor123</span>
            <span>viewer@demo.com / viewer123</span>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminPage({
  session,
  users,
  posts,
  onDeleteUser,
  onChangeUserRole,
  onCreatePost,
  onEditPost,
  onDeletePost,
  postForm,
  setPostForm,
  editingPostId,
}) {
  return (
    <main className="content-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow success">Admin Panel</p>
          <h2>Admin Work Area</h2>
        </div>
        <span className="pill">{session.user.role.toUpperCase()}</span>
      </div>

      <div className="admin-layout">
        <section className="list-panel">
          <div className="panel-title-row">
            <h3>Users List</h3>
            <span className="panel-badge">{users.length} users</span>
          </div>

          <div className="user-list">
            {users.map((user) => (
              <div className="list-item" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                  <small>{user.role}</small>
                </div>

                <div className="action-row">
                  <select
                    value={user.role}
                    onChange={(event) => onChangeUserRole(user.id, event.target.value)}
                  >
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                    <option value="viewer">viewer</option>
                  </select>
                  {user.email !== session.user.email && (
                    <button type="button" className="danger" onClick={() => onDeleteUser(user.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="list-panel">
          <div className="panel-title-row">
            <h3>Posts</h3>
            <span className="panel-badge">{posts.length} posts</span>
          </div>

          <form className="post-form" onSubmit={onCreatePost}>
            <input
              value={postForm.title}
              onChange={(event) => setPostForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Post title"
              required
            />
            <textarea
              value={postForm.content}
              onChange={(event) => setPostForm((previous) => ({ ...previous, content: event.target.value }))}
              placeholder="Write post content"
              rows="3"
              required
            />
            <div className="post-form-actions">
              <input
                value={postForm.author}
                onChange={(event) => setPostForm((previous) => ({ ...previous, author: event.target.value }))}
                placeholder="Author name"
                required
              />
              <button type="submit" className="primary small">
                {editingPostId ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </form>

          <div className="post-list">
            {posts.map((post) => (
              <div className="list-item post-item" key={post.id}>
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.content}</p>
                  <small>
                    {post.author} • {post.role}
                  </small>
                </div>

                <div className="action-row">
                  <button type="button" className="secondary small" onClick={() => onEditPost(post)}>
                    Edit
                  </button>
                  <button type="button" className="danger small" onClick={() => onDeletePost(post.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function EditorPage({
  session,
  posts,
  onEditPost,
  onDeletePost,
}) {
  return (
    <main className="content-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow success">Editor Panel</p>
          <h2>Edit Posts</h2>
        </div>
        <span className="pill">{session.user.role.toUpperCase()}</span>
      </div>

      <section className="list-panel">
        <div className="panel-title-row">
          <h3>Post Management</h3>
          <span className="panel-badge">{posts.length} posts</span>
        </div>

        <div className="post-list">
          {posts.map((post) => (
            <div className="list-item post-item" key={post.id}>
              <div>
                <strong>{post.title}</strong>
                <p>{post.content}</p>
                <small>
                  {post.author} • {post.role}
                </small>
              </div>

              <div className="action-row">
                <button type="button" className="secondary small" onClick={() => onEditPost(post)}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function ViewerPage({ posts, session }) {
  return (
    <main className="content-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow success">Viewer Panel</p>
          <h2>View Posts</h2>
        </div>
        <span className="pill">{session.user.role.toUpperCase()}</span>
      </div>

      <section className="list-panel">
        <div className="panel-title-row">
          <h3>Published Posts</h3>
          <span className="panel-badge">{posts.length} posts</span>
        </div>

        <div className="post-list">
          {posts.map((post) => (
            <div className="list-item post-item" key={post.id}>
              <div>
                <strong>{post.title}</strong>
                <p>{post.content}</p>
                <small>
                  {post.author} • {post.role}
                </small>
              </div>
              <span className="read-only-tag">Read-only</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function UnauthorizedPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card warning-card">
        <p className="eyebrow warning">Access denied</p>
        <h1>Unauthorized</h1>
        <p className="message-text">
          You do not have permission to view this page. Please log in with an allowed role.
        </p>
        <Link to="/dashboard" className="primary-link">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}

function App() {
  const [form, setForm] = useState({ email: 'admin@demo.com', password: 'admin123' })
  const [session, setSession] = useState(null)
  const [users, setUsers] = useState(initialUsers)
  const [posts, setPosts] = useState(initialPosts)
  const [postForm, setPostForm] = useState({ title: '', content: '', author: '' })
  const [editingPostId, setEditingPostId] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)

    if (!savedToken) {
      return
    }

    verifyToken(savedToken, JWT_SECRET).then((result) => {
      if (result.valid) {
        setSession({ token: savedToken, user: result.payload })
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    })
  }, [])

  const canManageUsers = (role) => role === 'admin'
  const canManagePosts = (role) => ['admin', 'editor'].includes(role)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const user = users.find(
      (entry) =>
        entry.email.toLowerCase() === form.email.trim().toLowerCase() &&
        entry.password === form.password,
    )

    if (!user) {
      setError('Invalid email or password. Use one of the demo credentials below.')
      setIsLoading(false)
      return
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: now + 3600,
    }

    const token = await createJwt(payload, JWT_SECRET)
    localStorage.setItem(TOKEN_KEY, token)
    setSession({ token, user: payload })
    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setSession(null)
    setPostForm({ title: '', content: '', author: '' })
    setEditingPostId(null)
    setForm({ email: 'admin@demo.com', password: 'admin123' })
  }

  const handleDeleteUser = (userId) => {
    if (!session || !canManageUsers(session.user.role)) return

    const targetUser = users.find((user) => user.id === userId)
    if (targetUser && targetUser.email === session.user.email) {
      return
    }

    setUsers((previous) => previous.filter((user) => user.id !== userId))
  }

  const handleChangeUserRole = (userId, newRole) => {
    if (!session || !canManageUsers(session.user.role)) return

    setUsers((previous) =>
      previous.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      ),
    )
  }

  const handleCreateOrUpdatePost = (event) => {
    event.preventDefault()
    if (!session || !canManagePosts(session.user.role)) return

    const trimmedTitle = postForm.title.trim()
    const trimmedContent = postForm.content.trim()
    const trimmedAuthor = postForm.author.trim()

    if (!trimmedTitle || !trimmedContent || !trimmedAuthor) {
      return
    }

    if (editingPostId) {
      setPosts((previous) =>
        previous.map((post) =>
          post.id === editingPostId
            ? {
                ...post,
                title: trimmedTitle,
                content: trimmedContent,
                author: trimmedAuthor,
                role: session.user.role,
              }
            : post,
        ),
      )
      setEditingPostId(null)
    } else {
      const newPost = {
        id: `p-${Date.now()}`,
        title: trimmedTitle,
        content: trimmedContent,
        author: trimmedAuthor,
        role: session.user.role,
      }
      setPosts((previous) => [newPost, ...previous])
    }

    setPostForm({ title: '', content: '', author: '' })
  }

  const handleEditPost = (post) => {
    if (!session || !canManagePosts(session.user.role)) return
    setEditingPostId(post.id)
    setPostForm({ title: post.title, content: post.content, author: post.author })
  }

  const handleDeletePost = (postId) => {
    if (!session || !canManagePosts(session.user.role)) return
    setPosts((previous) => previous.filter((post) => post.id !== postId))
    if (editingPostId === postId) {
      setEditingPostId(null)
      setPostForm({ title: '', content: '', author: '' })
    }
  }

  const roleHomePage = {
    admin: '/admin',
    editor: '/editor',
    viewer: '/viewer',
  }

  return (
    <div className="app-shell">
      <header className="main-nav">
        <div className="brand-wrap">
          <span className="brand-mark">RBAC</span>
          <span>JWT Access Demo</span>
        </div>

        {session ? (
          <nav className="nav-links">
            {session.user.role === 'admin' && <Link to="/admin">Admin</Link>}
            {session.user.role === 'editor' && <Link to="/editor">Editor</Link>}
            {(session.user.role === 'admin' || session.user.role === 'editor' || session.user.role === 'viewer') && (
              <Link to="/viewer">Viewer</Link>
            )}
            <button className="secondary" type="button" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        ) : (
          <Link to="/login" className="nav-login">
            Login
          </Link>
        )}
      </header>

      <Routes>
        <Route path="/" element={<Navigate to={session ? roleHomePage[session.user.role] : '/login'} replace />} />
        <Route path="/dashboard" element={<Navigate to={session ? roleHomePage[session.user.role] : '/login'} replace />} />
        <Route
          path="/login"
          element={
            <LoginPage
              session={session}
              form={form}
              setForm={setForm}
              onLogin={handleLogin}
              error={error}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute session={session} allowedRoles={['admin']}>
              <AdminPage
                session={session}
                users={users}
                posts={posts}
                onDeleteUser={handleDeleteUser}
                onChangeUserRole={handleChangeUserRole}
                onCreatePost={handleCreateOrUpdatePost}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost}
                postForm={postForm}
                setPostForm={setPostForm}
                editingPostId={editingPostId}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute session={session} allowedRoles={['editor']}>
              <EditorPage
                session={session}
                posts={posts}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewer"
          element={
            <ProtectedRoute session={session} allowedRoles={['viewer']}>
              <ViewerPage session={session} posts={posts} />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to={session ? roleHomePage[session.user.role] : '/login'} replace />} />
      </Routes>
    </div>
  )
}

export default App
