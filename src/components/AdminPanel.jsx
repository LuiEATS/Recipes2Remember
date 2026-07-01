import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import TagBadge from './TagBadge.jsx'

const UNITS = ['cup','tbsp','tsp','oz','lb','g','kg','ml','L','clove','whole','piece','slice','bunch','pinch']

function emptyIngredient() { return { name: '', amount: '', unit: 'cup' } }
function emptyStep() { return { text: '', photos: [], video: '' } }

export default function AdminPanel({ onClose }) {
  const [recipes, setRecipes] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    setRecipes(data || [])
    setLoading(false)
  }

  const visible = filter === 'all' ? recipes : recipes.filter(r => r.status === filter)

  // ── Selection ──
  function toggleSelect(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }
  function toggleAll() {
    setSelected(s => s.length === visible.length ? [] : visible.map(r => r.id))
  }

  // ── Archive / Restore ──
  async function toggleStatus(recipe) {
    const next = recipe.status === 'archived' ? 'published' : 'archived'
    await supabase.from('recipes').update({ status: next }).eq('id', recipe.id)
    fetchAll()
  }

  // ── Delete ──
  async function deleteOne(id) {
    if (!window.confirm('Delete this recipe permanently?')) return
    await supabase.from('recipes').delete().eq('id', id)
    setSelected(s => s.filter(x => x !== id))
    fetchAll()
  }

  async function bulkDelete() {
    if (!window.confirm(`Delete ${selected.length} recipes permanently?`)) return
    await supabase.from('recipes').delete().in('id', selected)
    setSelected([])
    fetchAll()
  }

  async function bulkArchive() {
    await supabase.from('recipes').update({ status: 'archived' }).in('id', selected)
    setSelected([])
    fetchAll()
  }

  // ── Edit ──
  function openEdit(recipe) {
    setEditId(recipe.id)
    setEditData({
      title: recipe.title || '',
      description: recipe.description || '',
      image_url: recipe.image_url || '',
      video_url: recipe.video_url || '',
      author: recipe.author || '',
      servings: recipe.servings || 4,
      prep_time: recipe.prep_time || '',
      cook_time: recipe.cook_time || '',
      status: recipe.status || 'published',
      tags: recipe.tags || [],
      ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length
        ? recipe.ingredients.map(i => ({ name: i.name || '', amount: i.amount || '', unit: i.unit || 'cup' }))
        : [emptyIngredient()],
      steps: Array.isArray(recipe.steps) && recipe.steps.length
        ? recipe.steps.map(s => ({ text: s.text || '', photos: s.photos || [], video: s.video || '' }))
        : [emptyStep()],
      nutrition_facts: recipe.nutrition_facts || { calories: '', protein: '', carbs: '', fat: '', fiber: '' },
    })
    setError('')
  }

  function setEd(key, val) { setEditData(d => ({ ...d, [key]: val })) }

  function setIng(i, key, val) {
    const ings = [...editData.ingredients]
    ings[i] = { ...ings[i], [key]: val }
    setEd('ingredients', ings)
  }

  function setStep(i, val) {
    const steps = [...editData.steps]
    steps[i] = { ...steps[i], text: val }
    setEd('steps', steps)
  }

  async function saveEdit() {
    setSaving(true)
    setError('')
    try {
      const nf = {}
      Object.entries(editData.nutrition_facts).forEach(([k, v]) => {
        if (v !== '' && v !== undefined) nf[k] = Number(v)
      })
      const update = {
        title: editData.title.trim(),
        description: editData.description.trim(),
        image_url: editData.image_url.trim(),
        video_url: editData.video_url.trim(),
        author: editData.author.trim(),
        servings: Number(editData.servings) || 4,
        prep_time: editData.prep_time.trim(),
        cook_time: editData.cook_time.trim(),
        status: editData.status,
        tags: editData.tags,
        nutrition_facts: nf,
        ingredients: editData.ingredients
          .filter(i => i.name.trim())
          .map(i => ({ name: i.name.trim(), amount: Number(i.amount) || 0, unit: i.unit })),
        steps: editData.steps
          .filter(s => s.text.trim())
          .map(s => ({ text: s.text.trim(), photos: s.photos || [], video: s.video || '' })),
      }
      const { error: err } = await supabase.from('recipes').update(update).eq('id', editId)
      if (err) throw err
      setEditId(null)
      setEditData(null)
      fetchAll()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filterLabels = ['all','published','archived','draft']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box admin-modal" style={{maxWidth:900}} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-content">
          <div className="modal-eyebrow">— Kitchen Management —</div>
          <h2 className="modal-title">Admin Panel</h2>

          <div className="admin-toolbar">
            <div className="admin-filters">
              {filterLabels.map(f => (
                <button
                  key={f}
                  className={`tab-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                  style={{padding:'7px 16px'}}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {selected.length > 0 && (
              <div className="bulk-actions">
                <span style={{fontSize:12,color:'var(--denim-light)'}}>{selected.length} selected</span>
                <button className="btn-sm danger" onClick={bulkDelete}>🗑 Delete</button>
                <button className="btn-sm" onClick={bulkArchive}>📦 Archive</button>
              </div>
            )}
          </div>

          {loading ? (
            <p style={{textAlign:'center',padding:40,color:'var(--denim-light)'}}>Loading…</p>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{width:32}}>
                      <input type="checkbox"
                        checked={selected.length === visible.length && visible.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th>Recipe</th>
                    <th>Status</th>
                    <th>♥ Likes</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id} className={selected.includes(r.id) ? 'selected-row' : ''}>
                      <td>
                        <input type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                        />
                      </td>
                      <td>
                        <div className="admin-recipe-name">
                          {r.image_url
                            ? <img src={r.image_url} className="admin-thumb" alt={r.title} />
                            : <div className="admin-thumb" style={{background:'var(--cream-dark)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🍽️</div>
                          }
                          <div>
                            <div style={{fontWeight:700,color:'var(--ink)',fontSize:13}}>{r.title}</div>
                            <div style={{fontSize:11,color:'var(--denim-light)'}}>by {r.author}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${r.status}`}>{r.status}</span>
                      </td>
                      <td style={{color:'var(--denim-light)',fontSize:13}}>{r.likes_count || 0}</td>
                      <td style={{color:'var(--denim-light)',fontSize:12}}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="admin-btns">
                          <button className="btn-sm" onClick={() => openEdit(r)}>Edit</button>
                          <button className="btn-sm" onClick={() => toggleStatus(r)}>
                            {r.status === 'archived' ? 'Restore' : 'Archive'}
                          </button>
                          <button className="btn-sm danger" onClick={() => deleteOne(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editId && editData && (
        <div className="modal-overlay" style={{zIndex:250}} onClick={() => setEditId(null)}>
          <div className="modal-box" style={{maxWidth:700}} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditId(null)}>×</button>
            <div className="modal-content">
              <div className="modal-eyebrow">— Edit Recipe —</div>
              <h2 className="modal-title" style={{fontSize:20,marginBottom:16}}>
                {editData.title || 'Untitled'}
              </h2>

              <div className="form-section">
                <span className="form-section-label">Basics</span>
                <label className="form-label">Title</label>
                <input className="form-input" value={editData.title} onChange={e => setEd('title', e.target.value)} />
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={editData.description} onChange={e => setEd('description', e.target.value)} />
                <label className="form-label">Cover Image URL</label>
                <input className="form-input" value={editData.image_url} onChange={e => setEd('image_url', e.target.value)} />
                <label className="form-label">Video URL</label>
                <input className="form-input" value={editData.video_url} onChange={e => setEd('video_url', e.target.value)} />
                <div className="form-row">
                  <div>
                    <label className="form-label">Author</label>
                    <input className="form-input" value={editData.author} onChange={e => setEd('author', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Servings</label>
                    <input className="form-input" type="number" value={editData.servings} onChange={e => setEd('servings', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label className="form-label">Prep Time</label>
                    <input className="form-input" value={editData.prep_time} onChange={e => setEd('prep_time', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Cook Time</label>
                    <input className="form-input" value={editData.cook_time} onChange={e => setEd('cook_time', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={editData.status} onChange={e => setEd('status', e.target.value)}>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <span className="form-section-label">Tags</span>
                <div className="tag-input-row">
                  {editData.tags.map(t => (
                    <TagBadge key={t} tag={t} onRemove={t => setEd('tags', editData.tags.filter(x => x !== t))} />
                  ))}
                </div>
                <input className="form-input" placeholder="Type tag + Enter"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const v = e.target.value.trim()
                      if (v && !editData.tags.includes(v)) setEd('tags', [...editData.tags, v])
                      e.target.value = ''
                    }
                  }}
                />
              </div>

              <div className="form-section">
                <span className="form-section-label">Ingredients</span>
                {editData.ingredients.map((ing, i) => (
                  <div key={i} className="form-row" style={{alignItems:'center',marginBottom:6}}>
                    <input className="form-input" style={{flex:3,marginBottom:0}} placeholder="Ingredient"
                      value={ing.name} onChange={e => setIng(i, 'name', e.target.value)} />
                    <input className="form-input" style={{flex:1,marginBottom:0}} type="number" placeholder="Amt"
                      value={ing.amount} onChange={e => setIng(i, 'amount', e.target.value)} />
                    <select className="form-input" style={{flex:1,marginBottom:0}} value={ing.unit}
                      onChange={e => setIng(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button type="button" className="btn-remove"
                      onClick={() => setEd('ingredients', editData.ingredients.filter((_, j) => j !== i))}>×</button>
                  </div>
                ))}
                <button type="button" className="btn-add"
                  onClick={() => setEd('ingredients', [...editData.ingredients, emptyIngredient()])}>
                  + Add Ingredient
                </button>
              </div>

              <div className="form-section">
                <span className="form-section-label">Steps</span>
                {editData.steps.map((step, i) => (
                  <div key={i} className="step-form-block">
                    <div className="step-form-header">
                      <div className="step-num">{i + 1}</div>
                      <span style={{flex:1,fontSize:12,color:'var(--denim-light)',textTransform:'uppercase',letterSpacing:2}}>Step {i + 1}</span>
                      <button type="button" className="btn-remove"
                        onClick={() => setEd('steps', editData.steps.filter((_, j) => j !== i))}>×</button>
                    </div>
                    <textarea className="form-input" rows={3} value={step.text}
                      onChange={e => setStep(i, e.target.value)} />
                  </div>
                ))}
                <button type="button" className="btn-add"
                  onClick={() => setEd('steps', [...editData.steps, emptyStep()])}>
                  + Add Step
                </button>
              </div>

              <div className="form-section">
                <span className="form-section-label">Nutrition Facts</span>
                <div className="nutrition-form-grid">
                  {['calories','protein','carbs','fat','fiber'].map(k => (
                    <div key={k}>
                      <label className="form-label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                      <input className="form-input" type="number" min={0}
                        value={editData.nutrition_facts[k] || ''}
                        onChange={e => setEd('nutrition_facts', { ...editData.nutrition_facts, [k]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button className="btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes ✦'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
