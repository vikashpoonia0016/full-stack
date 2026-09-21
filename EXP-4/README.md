# Post Scheduler — Interactive Calendar

## How to Run

```bash
npm install
npm run dev       # start app → http://localhost:5173
npm test          # run all tests
```

---

## Folder Structure

```
exp 4/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx            → mounts the app
    ├── App.jsx             → root component
    ├── Calendar.jsx        → main calendar grid + all state logic
    ├── CalendarDay.jsx     → single day cell (memoized)
    ├── EventModal.jsx      → add post modal
    ├── setupTests.js       → jest-dom setup
    ├── Calendar.test.jsx   → 10 UI tests
    └── index.css           → all styles
```

---

## What You See After Execution

- A full monthly calendar grid
- Current month highlighted with today's date in blue
- A default "Welcome Post" on today's date
- Prev / Next buttons to navigate months
- Click any date → modal opens → type post title → Save
- Posts appear as blue chips on the date
- Drag a post chip to another date to reschedule it
- Click × on a post chip to delete it

---

## Features

| Feature | How it works |
|---|---|
| Monthly calendar grid | Built using JS Date to calculate days and starting weekday |
| Navigate months | Prev/Next buttons update month/year state |
| Add post | Click a date → modal opens → type title → Save |
| Delete post | Click × on any post chip |
| Drag and drop | Drag a post chip to any other date to move it |
| Today highlight | Today's cell has a blue border |

---

## Concepts Used

### 1. useState
Manages month, year, posts object, and modal open/close state.

```js
const [posts, setPosts] = useState({})
const [modalDate, setModalDate] = useState(null)
```

### 2. useMemo
Builds the calendar day grid only when month or year changes.
Avoids recalculating all days on every unrelated state update.

```js
const calendarDays = useMemo(() => {
  // calculate days in month + empty cells
}, [year, month])
```

### 3. useCallback
Memoizes all event handlers (add, delete, drag, drop, navigate).
Ensures CalendarDay (wrapped in React.memo) does not re-render unnecessarily.

```js
const handleDelete = useCallback((date, id) => { ... }, [])
const handleDrop   = useCallback((toDate) => { ... }, [])
```

### 4. React.memo
Wraps CalendarDay so it only re-renders when its own props change.
Without this, every day cell would re-render when any post anywhere changes.

```js
const CalendarDay = memo(function CalendarDay({ ... }) { ... })
```

### 5. useRef
Stores drag state (which post is being dragged and from where).
useRef does not cause a re-render when updated — perfect for drag tracking.

```js
const dragInfo = useRef(null) // { post, fromDate }
```

### 6. HTML5 Drag and Drop
Native browser drag events used to move posts between dates.

```
draggable         → makes the post chip draggable
onDragStart       → saves which post is being dragged
onDragOver        → e.preventDefault() to allow drop
onDrop            → moves post to the new date in state
```

---

## Testing (10 Tests)

| # | Test | What it checks |
|---|---|---|
| 1 | Renders current month and year | Calendar shows correct heading |
| 2 | Renders all 7 day labels | Sun Mon Tue Wed Thu Fri Sat visible |
| 3 | Shows default welcome post | Pre-loaded post visible on today |
| 4 | Prev navigates to previous month | Month heading changes correctly |
| 5 | Next navigates to next month | Month heading changes correctly |
| 6 | Click day opens modal | Add Post modal appears |
| 7 | Add post saves to calendar | New post chip visible on calendar |
| 8 | Cancel closes modal | Modal disappears |
| 9 | Delete removes post | Post chip removed from calendar |
| 10 | Empty input does not save | Modal stays open, no empty post added |

---

## Key Concepts Summary

| Concept | Purpose |
|---|---|
| `React.memo` | Skip re-render of day cells when unrelated state changes |
| `useCallback` | Stable handler references so memo works correctly |
| `useMemo` | Recalculate calendar grid only when month/year changes |
| `useRef` | Track drag state without triggering re-renders |
| `useState` | Manage posts, navigation, and modal state |
| Drag & Drop | HTML5 native events to move posts between dates |
