export default function TagBadge({ tag, onRemove, onClick, active }) {
  return (
    <span
      className={`tag-badge ${active ? 'active' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {tag}
      {onRemove && (
        <button
          className="tag-remove"
          onClick={e => { e.stopPropagation(); onRemove(tag); }}
          type="button"
        >
          ×
        </button>
      )}
    </span>
  )
}
