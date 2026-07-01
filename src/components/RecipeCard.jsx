import TagBadge from './TagBadge.jsx'
import { formatAmount } from '../lib/units.js'

export default function RecipeCard({
  recipe, onOpen, onLike, onFavorite, onSelect, selected,
  isLiked, isFavorited, onPDF, pdfLoading, onTagClick
}) {
  return (
    <div className={`recipe-card ${selected ? 'selected' : ''}`}>
      <div className="card-img-wrap" onClick={() => onOpen(recipe)}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} />
          : <div className="card-img-placeholder">🍽️</div>
        }
        <div className="card-stamp">Recipe</div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="card-tags">
            {recipe.tags.slice(0, 2).map(t => (
              <TagBadge key={t} tag={t} onClick={e => { e.stopPropagation(); onTagClick && onTagClick(t) }} />
            ))}
          </div>
        )}
      </div>

      <div className="card-body">
        <h3 onClick={() => onOpen(recipe)}>{recipe.title}</h3>
        {recipe.description && (
          <p className="card-desc">{recipe.description}</p>
        )}
        <div className="card-divider" />
        <div className="card-meta">
          {recipe.prep_time && <span>⏱ {recipe.prep_time}</span>}
          {recipe.cook_time && <span>🔥 {recipe.cook_time}</span>}
          {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
        </div>
        <div className="card-footer">
          <span className="card-author">by {recipe.author}</span>
          <div className="card-actions">
            <button
              className={`btn-icon ${isLiked ? 'liked' : ''}`}
              onClick={() => onLike(recipe.id)}
              title="Like"
            >
              {isLiked ? '♥' : '♡'} {recipe.likes_count || 0}
            </button>
            <button
              className={`btn-icon ${isFavorited ? 'saved' : ''}`}
              onClick={() => onFavorite(recipe.id)}
              title="Save"
            >
              {isFavorited ? '★' : '☆'}
            </button>
            <button
              className={`btn-icon ${selected ? 'cart-active' : ''}`}
              onClick={() => onSelect(recipe.id)}
              title="Add to shopping list"
            >
              🛒
            </button>
            <button
              className="btn-icon pdf-btn"
              onClick={() => onPDF(recipe)}
              disabled={pdfLoading === recipe.id}
              title="Download PDF"
            >
              {pdfLoading === recipe.id ? '⏳' : '📄'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
