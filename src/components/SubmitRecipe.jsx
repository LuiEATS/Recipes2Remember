import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import TagBadge from './TagBadge.jsx'

const ALL_TAGS = [
  'Breakfast','Southern','Comfort Food','Family','Dessert','Summer',
  'Cast Iron','Sides','Slow Cook','Budget','Preserves','Smokehouse',
  'Pies','Garden','Harvest','Italian','Pasta','Vegetarian','Quick',
  'American','Kids','Salad','Vegan','Gluten-Free','Meat','Seafood','Soup'
]

const UNITS = ['cup','tbsp','tsp','oz','lb','g','kg','ml','L','clove','whole','piece','slice','bunch','pinch']

function emptyIngredient() { return { name: '', amount: '', unit: 'cup' } }
function emptyStep() { return { text: '', photos: [], video: '' } }

export default function SubmitRecipe({ onSubmit, onClose, user }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    author: user?.email?.split('@')[0] || '',
    servings: 4,
    prep_time: '',
    cook_time: '',
    tags: [],
    image_url: '',
    ingredients: [emptyIngredient()],
    steps: [emptyStep()],
    nutrition_facts: { calories: '', protein: '', carbs: '', fat: '', fiber: '' },
  })
  const [coverPreview, setCoverPreview] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const coverRef = useRef()
  const photoRefs = useRef([])
  const videoRefs = useRef([])

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  // ── Ingredients ──
  function setIng(i, key, val) {
    const ings = [...form.ingredients]
    ings[i] = { ...ings[i], [key]: val }
    setField('ingredients', ings)
  }
  function addIng() { setField('ingredients', [...form.ingredients, emptyIngredient()]) }
  function removeIng(i) { setField('ingredients', form.ingredients.filter((_, j) => j !== i)) }

  // ── Steps ──
  function setStep(i, key, val) {
    const steps = [...form.steps]
    steps[i] = { ...steps[i], [key]: val }
    setField('steps', steps)
  }
  function addStep() { setField('steps', [...form.steps, emptyStep()]) }
  function removeStep(i) { setField('steps', form.steps.filter((_, j) => j !== i)) }

  // ── Tags ──
  function addTag(tag) {
    const t = tag.trim()
    if (t && !form.tags.includes(t)) setField('tags', [...form.tags, t])
  }
  function removeTag(t) { setField('tags', form.tags.filter(x => x !== t)) }

  // ── Upload helpers ──
  async function uploadFile(file, bucket) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  // ── Cover photo ──
  async function handleCover(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverPreview(URL.createObjectURL(file))
    try {
      const url = await uploadFile(file, 'recipe-covers')
      setField('image_url', url)
    } catch (err) {
      setError('Cover upload failed: ' + err.message)
    }
  }

  // ── Step photos ──
  async function handleStepPhotos(stepIdx, e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f, 'step-media')))
      const steps = [...form.steps]
      steps[stepIdx] = { ...steps[stepIdx], photos: [...steps[stepIdx].photos, ...urls] }
      setField('steps', steps)
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    }
  }

  function removeStepPhoto(stepIdx, photoIdx) {
    const steps = [...form.steps]
    steps[stepIdx] = { ...steps[stepIdx], photos: steps[stepIdx].photos.filter((_, j) => j !== photoIdx) }
    setField('steps', steps)
  }

  // ── Step video ──
  async function handleStepVideo(stepIdx, e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadFile(file, 'step-media')
      setStep(stepIdx, 'video', url)
    } catch (err) {
      setError('Video upload failed: ' + err.message)
    }
  }

  // ── Submit ──
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Title is required.')
    if (!form.author.trim()) return setError('Author is required.')
    setLoading(true)
    try {
      const nf = {}
      Object.entries(form.nutrition_facts).forEach(([k, v]) => {
        if (v !== '') nf[k] = Number(v)
      })
      const recipe = {
        title: form.title.trim(),
        description: form.description.trim(),
        image_url: form.image_url,
        author: form.author.trim(),
        servings: Number(form.servings) || 4,
        prep_time: form.prep_time.trim(),
        cook_time: form.cook_time.trim(),
        tags: form.tags,
        nutrition_facts: nf,
        ingredients: form.ingredients
          .filter(i => i.name.trim())
          .map(i => ({ name: i.name.trim(), amount: Number(i.amount) || 0, unit: i.unit })),
        steps: form.steps
          .filter(s => s.text.trim())
          .map(s => ({ text: s.text.trim(), photos: s.photos, video: s.video })),
        status: 'published',
      }
      const { error: insertError } = await supabase.from('recipes').insert(recipe)
      if (insertError) throw insertError
      onSubmit()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box submit-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-content">
          <div className="modal-eyebrow">— Share the Love —</div>
          <h2 className="modal-title">Add a Recipe</h2>

          <form onSubmit={handleSubmit}>

            {/* BASICS */}
            <div className="form-section">
              <span className="form-section-label">The Basics</span>

              <label className="form-label">Recipe Title *</label>
              <input className="form-input" placeholder="What do you call this dish?" value={form.title}
                onChange={e => setField('title', e.target.value)} required />

              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="A little story about this recipe…"
                value={form.description} onChange={e => setField('description', e.target.value)} />

              <div className="form-row">
                <div>
                  <label className="form-label">Author *</label>
                  <input className="form-input" placeholder="Your name" value={form.author}
                    onChange={e => setField('author', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Servings</label>
                  <input className="form-input" type="number" min={1} value={form.servings}
                    onChange={e => setField('servings', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Prep Time</label>
                  <input className="form-input" placeholder="e.g. 15 min" value={form.prep_time}
                    onChange={e => setField('prep_time', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Cook Time</label>
                  <input className="form-input" placeholder="e.g. 30 min" value={form.cook_time}
                    onChange={e => setField('cook_time', e.target.value)} />
                </div>
              </div>

              <label className="form-label">Cover Photo</label>
              {coverPreview && <img src={coverPreview} className="cover-preview" alt="Cover preview" />}
              <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCover} />
              <button type="button" className="btn-media" onClick={() => coverRef.current.click()}>
                📷 {form.image_url ? 'Change Photo' : 'Upload Cover Photo'}
              </button>
            </div>

            {/* TAGS */}
            <div className="form-section">
              <span className="form-section-label">Tags</span>
              <div className="tag-input-row">
                {form.tags.map(t => <TagBadge key={t} tag={t} onRemove={removeTag} />)}
              </div>
              <div className="form-row" style={{marginBottom:8}}>
                <input
                  className="form-input"
                  placeholder="Type a tag and press Enter"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput('') }}}
                  style={{marginBottom:0}}
                />
                <select className="form-input" style={{marginBottom:0}} value=""
                  onChange={e => { addTag(e.target.value); e.target.value = '' }}>
                  <option value="">+ Common tags</option>
                  {ALL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* INGREDIENTS */}
            <div className="form-section">
              <span className="form-section-label">Ingredients</span>
              {form.ingredients.map((ing, i) => (
                <div key={i} className="form-row" style={{alignItems:'center', marginBottom:6}}>
                  <input className="form-input" style={{flex:3,marginBottom:0}} placeholder="Ingredient name"
                    value={ing.name} onChange={e => setIng(i, 'name', e.target.value)} />
                  <input className="form-input" style={{flex:1,marginBottom:0}} type="number" min={0} step="any"
                    placeholder="Amt" value={ing.amount} onChange={e => setIng(i, 'amount', e.target.value)} />
                  <select className="form-input" style={{flex:1,marginBottom:0}} value={ing.unit}
                    onChange={e => setIng(i, 'unit', e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button type="button" className="btn-remove" onClick={() => removeIng(i)}>×</button>
                </div>
              ))}
              <button type="button" className="btn-add" onClick={addIng}>+ Add Ingredient</button>
            </div>

            {/* STEPS */}
            <div className="form-section">
              <span className="form-section-label">Steps — with Photos & Video</span>
              {form.steps.map((step, i) => (
                <div key={i} className="step-form-block">
                  <div className="step-form-header">
                    <div className="step-num">{i + 1}</div>
                    <span style={{flex:1, fontSize:12, color:'var(--denim-light)', textTransform:'uppercase', letterSpacing:2}}>Step {i + 1}</span>
                    <button type="button" className="btn-remove" onClick={() => removeStep(i)}>×</button>
                  </div>
                  <textarea className="form-input" rows={3} placeholder="Describe this step…"
                    value={step.text} onChange={e => setStep(i, 'text', e.target.value)} />

                  <div className="step-media-editor">
                    <div className="step-media-btns">
                      <input
                        ref={el => photoRefs.current[i] = el}
                        type="file" accept="image/*" multiple style={{display:'none'}}
                        onChange={e => handleStepPhotos(i, e)}
                      />
                      <button type="button" className="btn-media"
                        onClick={() => photoRefs.current[i]?.click()}>
                        📷 Add Photos
                      </button>
                      <input
                        ref={el => videoRefs.current[i] = el}
                        type="file" accept="video/*" style={{display:'none'}}
                        onChange={e => handleStepVideo(i, e)}
                      />
                      {!step.video && (
                        <button type="button" className="btn-media"
                          onClick={() => videoRefs.current[i]?.click()}>
                          🎬 Add Video
                        </button>
                      )}
                      {step.video && (
                        <button type="button" className="btn-media danger"
                          onClick={() => setStep(i, 'video', '')}>
                          🗑 Remove Video
                        </button>
                      )}
                    </div>

                    {step.photos.length > 0 && (
                      <div className="step-photos-row">
                        {step.photos.map((url, j) => (
                          <div key={j} className="step-photo-wrap">
                            <img src={url} className="step-photo-thumb" alt={`Step ${i+1} photo`} />
                            <button type="button" className="step-photo-remove"
                              onClick={() => removeStepPhoto(i, j)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {step.video && (
                      <video className="step-video-player" src={step.video} controls />
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="btn-add" onClick={addStep}>+ Add Step</button>
            </div>

            {/* NUTRITION */}
            <div className="form-section">
              <span className="form-section-label">Nutrition Facts (per serving)</span>
              <div className="nutrition-form-grid">
                {[
                  { key: 'calories', label: 'Calories' },
                  { key: 'protein',  label: 'Protein (g)' },
                  { key: 'carbs',    label: 'Carbs (g)' },
                  { key: 'fat',      label: 'Fat (g)' },
                  { key: 'fiber',    label: 'Fiber (g)' },
                ].map(n => (
                  <div key={n.key}>
                    <label className="form-label">{n.label}</label>
                    <input className="form-input" type="number" min={0} placeholder="0"
                      value={form.nutrition_facts[n.key]}
                      onChange={e => setField('nutrition_facts', { ...form.nutrition_facts, [n.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : '✦ Remember This Recipe ✦'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
