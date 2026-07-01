import { useState } from 'react'
import TagBadge from './TagBadge.jsx'
import { formatAmount } from '../lib/units.js'

export default function RecipeModal({
  recipe, onClose, onLike, onFavorite, onPDF, pdfLoading,
  isLiked, isFavorited
}) {
  const [tab, setTab] = useState('ingredients')

  const nf = recipe.nutrition_facts || {}
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {recipe.image_url && (
          <img className="modal-hero" src={recipe.image_url} alt={recipe.title} />
        )}

        <div className="modal-content">
          <div className="modal-eyebrow">— Tried & True —</div>
          <h2 className="modal-title">{recipe.title}</h2>

          {recipe.description && (
            <p className="modal-desc">{recipe.description}</p>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="modal-tags">
              {recipe.tags.map(t => <TagBadge key={t} tag={t} />)}
            </div>
          )}

          <div className="modal-quick">
            <div className="quick-stat">
              <span className="qs-val">{recipe.prep_time || '--'}</span>
              <span className="qs-label">Prep</span>
            </div>
            <div className="quick-divider" />
            <div className="quick-stat">
              <span className="qs-val">{recipe.cook_time || '--'}</span>
              <span className="qs-label">Cook</span>
            </div>
            <div className="quick-divider" />
            <div className="quick-stat">
              <span className="qs-val">{recipe.servings || '--'}</span>
              <span className="qs-label">Serves</span>
            </div>
            <div className="quick-divider" />
            <div className="quick-stat">
              <span className="qs-val" style={{fontSize:12}}>{recipe.author}</span>
              <span className="qs-label">By</span>
            </div>
          </div>

          <div className="modal-actions-row">
            <button
              className={`btn-modal-action ${isLiked ? 'liked' : ''}`}
              onClick={() => onLike(recipe.id)}
            >
              {isLiked ? '♥' : '♡'} {recipe.likes_count || 0} Likes
            </button>
            <button
              className={`btn-modal-action ${isFavorited ? 'saved' : ''}`}
              onClick={() => onFavorite(recipe.id)}
            >
              {isFavorited ? '★' : '☆'} {isFavorited ? 'Saved' : 'Save'}
            </button>
            <button
              className="btn-modal-action pdf-action"
              onClick={() => onPDF(recipe)}
              disabled={pdfLoading === recipe.id}
            >
              {pdfLoading === recipe.id ? '⏳ Generating…' : '📄 Print / Save PDF'}
            </button>
          </div>

          <div className="tab-bar">
            {['ingredients','steps','nutrition'].map(t => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'ingredients' && (
            <ul className="ingredient-list">
              {ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="ing-amount">
                    {formatAmount(ing.amount)} {ing.unit}
                  </span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          )}

          {tab === 'steps' && (
            <ol className="steps-list">
              {steps.map((step, i) => (
                <li key={i}>
                  <div className="step-num">{i + 1}</div>
                  <div>
                    <div className="step-text">{step.text}</div>
                    {step.photos && step.photos.length > 0 && (
                      <div className="step-photos-row">
                        {step.photos.map((url, j) => (
                          <img
                            key={j}
                            src={url}
                            alt={`Step ${i+1} photo ${j+1}`}
                            className="step-photo-thumb"
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                    {step.video && (
                      <video
                        className="step-video-player"
                        src={step.video}
                        controls
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === 'nutrition' && (
            <div className="nutrition-grid">
              {[
                { key: 'calories', label: 'Calories' },
                { key: 'protein',  label: 'Protein' },
                { key: 'carbs',    label: 'Carbs' },
                { key: 'fat',      label: 'Fat' },
                { key: 'fiber',    label: 'Fiber' },
              ].map(n => (
                <div key={n.key} className="nutrition-cell">
                  <span className="nutrition-val">{nf[n.key] ?? '--'}</span>
                  <span className="nutrition-label">{n.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
