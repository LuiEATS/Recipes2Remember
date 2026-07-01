import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { supabase } from './lib/supabase.js'
import { generateRecipePDF } from './lib/pdfRecipe.js'
import RecipeCard from './components/RecipeCard.jsx'
import RecipeModal from './components/RecipeModal.jsx'
import SubmitRecipe from './components/SubmitRecipe.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import AuthModal from './components/AuthModal.jsx'
import TagBadge from './components/TagBadge.jsx'

export default function App() {
  const [recipes, setRecipes]         = useState([])
  const [user, setUser]               = useState(null)
  const [view, setView]               = useState('home')
  const [search, setSearch]           = useState('')
  const [activeTag, setActiveTag]     = useState(null)
  const [openRecipe, setOpenRecipe]   = useState(null)
  const [showSubmit, setShowSubmit]   = useState(false)
  const [showAdmin, setShowAdmin]     = useState(false)
  const [showShopping, setShowShopping] = useState(false)
  const [showAuth, setShowAuth]       = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminPinInput, setAdminPinInput] = useState('')
  const [pdfLoading, setPdfLoading]   = useState(null)
  const [userLikes, setUserLikes]     = useState([])
  const [userFavorites, setUserFavorites] = useState([])
  const [loading, setLoading]         = useState(true)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) { fetchUserLikes(u.id); fetchUserFavorites(u.id) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) { fetchUserLikes(u.id); fetchUserFavorites(u.id) }
      else { setUserLikes([]); setUserFavorites([]) }
    })
    fetchRecipes()
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchRecipes() {
    setLoading(true)
    const { data } = await supabase
      .from('recipes').select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    setRecipes(data || [])
    setLoading(false)
  }

  async function fetchUserLikes(userId) {
    const { data } = await supabase.from('likes').select('recipe_id').eq('user_id', userId)
    setUserLikes((data || []).map(r => r.recipe_id))
  }

  async function fetchUserFavorites(userId) {
    const { data } = await supabase.from('favorites').select('recipe_id').eq('user_id', userId)
    setUserFavorites((data || []).map(r => r.recipe_id))
  }

  async function handleLike(recipeId) {
    if (!user) { setShowAuth(true); return }
    const liked = userLikes.includes(recipeId)
    if (liked) {
      await supabase.from('likes').delete().eq('recipe_id', recipeId).eq('user_id', user.id)
      await supabase.from('recipes').update({ likes_count: (recipes.find(r => r.id === recipeId)?.likes_count || 1) - 1 }).eq('id', recipeId)
      setUserLikes(l => l.filter(id => id !== recipeId))
      setRecipes(rs => rs.map(r => r.id === recipeId ? { ...r, likes_count: (r.likes_count || 1) - 1 } : r))
    } else {
      await supabase.from('likes').insert({ recipe_id: recipeId, user_id: user.id })
      await supabase.from('recipes').update({ likes_count: (recipes.find(r => r.id === recipeId)?.likes_count || 0) + 1 }).eq('id', recipeId)
      setUserLikes(l => [...l, recipeId])
      setRecipes(rs => rs.map(r => r.id === recipeId ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r))
    }
    if (openRecipe?.id === recipeId) {
      setOpenRecipe(r => ({ ...r, likes_count: liked ? (r.likes_count || 1) - 1 : (r.likes_count || 0) + 1 }))
    }
  }

  async function handleFavorite(recipeId) {
    if (!user) { setShowAuth(true); return }
    const faved = userFavorites.includes(recipeId)
    if (faved) {
      await supabase.from('favorites').delete().eq('recipe_id', recipeId).eq('user_id', user.id)
      setUserFavorites(f => f.filter(id => id !== recipeId))
    } else {
      await supabase.from('favorites').insert({ recipe_id: recipeId, user_id: user.id })
      setUserFavorites(f => [...f, recipeId])
    }
  }

  function handleSelect(recipeId) {
    setSelectedIds(s => s.includes(recipeId) ? s.filter(x => x !== recipeId) : [...s, recipeId])
  }

  async function handlePDF(recipe) {
    setPdfLoading(recipe.id)
    try { await generateRecipePDF(recipe) }
    catch (e) { console.error(e) }
    finally { setPdfLoading(null) }
  }

  function handleSubmitSuccess() {
    setShowSubmit(false)
    fetchRecipes()
  }

  function tryAdmin() {
    if (adminPinInput === import.meta.env.VITE_ADMIN_PIN) {
      setAdminUnlocked(true)
    } else {
      alert('Wrong PIN')
    }
  }

  function handleAddRecipe() {
    if (!user) { setPendingSubmit(true); setShowAuth(true) }
    else setShowSubmit(true)
  }

  function handleAuthSuccess() {
    setShowAuth(false)
    if (pendingSubmit) { setPendingSubmit(false); setShowSubmit(true) }
    if (user) { fetchUserLikes(user.id); fetchUserFavorites(user.id) }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setView('home')
  }

  const allTags = useMemo(() => {
    const set = new Set()
    recipes.forEach(r => (r.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [recipes])

  const visible = useMemo(() => {
    return recipes.filter(r => {
      if (view === 'favorites' && !userFavorites.includes(r.id)) return false
      if (search && !r.title?.toLowerCase().includes(search.toLowerCase()) &&
          !r.description?.toLowerCase().includes(search.toLowerCase())) return false
      if (activeTag && !(r.tags || []).includes(activeTag)) return false
      return true
    })
  }, [recipes, view, search, activeTag, userFavorites])

  return (
    <>
      {/* Banner */}
      <div className="banner-strip">✦ &nbsp; Homemade · Handed Down · Never Forgotten &nbsp; ✦</div>

      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          <div className="site-logo">
            <div className="logo-main">Recipes<span>2</span>Remember</div>
            <div className="logo-sub">Est. in Every Kitchen · Passed Down with Love</div>
          </div>
          <nav className="header-nav">
            <button className={`nav-btn ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
              All Recipes
            </button>
            <button className={`nav-btn ${view === 'favorites' ? 'active' : ''}`} onClick={() => {
              if (!user) { setShowAuth(true) } else setView('favorites')
            }}>
              ★ Saved
            </button>
            {selectedIds.length > 0 && (
              <button className="nav-btn active" onClick={() => setShowShopping(true)}>
                🛒 List ({selectedIds.length})
              </button>
            )}
            <button className="nav-btn cta" onClick={handleAddRecipe}>+ Add Recipe</button>
            {!user
              ? <button className="nav-btn" onClick={() => setShowAuth(true)}>Sign In</button>
              : <>
                  <span style={{color:'rgba(245,240,232,0.6)',fontSize:11,alignSelf:'center',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {user.email}
                  </span>
                  <button className="nav-btn" onClick={handleSignOut}>Sign Out</button>
                </>
            }
            <button className="nav-btn" onClick={() => setShowAdmin(true)}>⚙ Admin</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      {view === 'home' && (
        <div className="hero">
          <div className="hero-eyebrow">— A Living Cookbook —</div>
          <h1 className="hero-title">Recipes<span>2</span>Remember</h1>
          <p className="hero-subtitle">Every dish has a story. Write yours down.</p>
          <div className="hero-border" />
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search recipes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => {}}>Search</button>
          </div>
        </div>
      )}

      {/* Page body */}
      <div className="page-body">

        {/* Tags bar */}
        {allTags.length > 0 && (
          <div className="tags-section">
            <span className="tags-label">Browse by:</span>
            <TagBadge
              tag="All"
              active={!activeTag}
              onClick={() => setActiveTag(null)}
            />
            {allTags.map(t => (
              <TagBadge
                key={t}
                tag={t}
                active={activeTag === t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              />
            ))}
          </div>
        )}

        {/* Section header */}
        <div className="section-header">
          <h2 className="section-title">
            {view === 'favorites' ? 'Saved Recipes' : 'From the Recipe Box'}
          </h2>
          <div className="section-line" />
          <span className="section-count">{visible.length} recipe{visible.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{textAlign:'center',padding:60,color:'var(--denim-light)',fontFamily:'Playfair Display,serif',fontStyle:'italic',fontSize:18}}>
            Loading the recipe box…
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <div className="empty-state">
            <span className="e-icon">🍽️</span>
            <h3>{view === 'favorites' ? 'No saved recipes yet' : 'No recipes found'}</h3>
            <p>{view === 'favorites' ? 'Star a recipe to save it here.' : 'Try a different search or tag.'}</p>
          </div>
        )}

        {/* Cards */}
        {!loading && visible.length > 0 && (
          <div className="cards-grid">
            {visible.map(r => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onOpen={setOpenRecipe}
                onLike={handleLike}
                onFavorite={handleFavorite}
                onSelect={handleSelect}
                selected={selectedIds.includes(r.id)}
                isLiked={userLikes.includes(r.id)}
                isFavorited={userFavorites.includes(r.id)}
                onPDF={handlePDF}
                pdfLoading={pdfLoading}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="site-footer">
          <span>Recipes2Remember</span> · Every dish has a story. Write yours down.
        </footer>
      </div>

      {/* Floating shopping bar */}
      {selectedIds.length > 0 && (
        <div className="shopping-bar">
          🛒 {selectedIds.length} recipe{selectedIds.length !== 1 ? 's' : ''} selected
          <button onClick={() => setShowShopping(true)}>View List</button>
          <button className="bar-clear" onClick={() => setSelectedIds([])}>✕ Clear</button>
        </div>
      )}

      {/* Recipe modal */}
      {openRecipe && (
        <RecipeModal
          recipe={openRecipe}
          onClose={() => setOpenRecipe(null)}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onPDF={handlePDF}
          pdfLoading={pdfLoading}
          isLiked={userLikes.includes(openRecipe.id)}
          isFavorited={userFavorites.includes(openRecipe.id)}
        />
      )}

      {/* Submit recipe */}
      {showSubmit && user && (
        <SubmitRecipe
          user={user}
          onClose={() => setShowSubmit(false)}
          onSubmit={handleSubmitSuccess}
        />
      )}

      {/* Shopping list */}
      {showShopping && (
        <ShoppingList
          selectedIds={selectedIds}
          recipes={recipes}
          onClose={() => setShowShopping(false)}
        />
      )}

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          onClose={() => { setShowAuth(false); setPendingSubmit(false) }}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Admin gate */}
      {showAdmin && !adminUnlocked && (
        <div className="admin-gate">
          <div className="admin-gate-box">
            <h2>Admin Access</h2>
            <p>Enter your PIN to continue</p>
            <input
              className="form-input"
              type="password"
              placeholder="PIN"
              value={adminPinInput}
              onChange={e => setAdminPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tryAdmin()}
            />
            <button className="btn-primary" onClick={tryAdmin}>Enter</button>
            <button
              onClick={() => { setShowAdmin(false); setAdminPinInput('') }}
              style={{display:'block',margin:'12px auto 0',background:'none',border:'none',color:'var(--denim-light)',cursor:'pointer',fontSize:12}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin panel */}
      {showAdmin && adminUnlocked && (
        <AdminPanel onClose={() => {
          setShowAdmin(false)
          setAdminUnlocked(false)
          setAdminPinInput('')
          fetchRecipes()
        }} />
      )}
    </>
  )
}
