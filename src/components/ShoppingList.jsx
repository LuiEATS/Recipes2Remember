import { useState, useMemo } from 'react'
import { GROCERY_CATEGORIES, categorizeIngredient } from '../lib/categories.js'
import { normalizeUnit, formatAmount } from '../lib/units.js'
import { generateShoppingListPDF } from '../lib/pdfShopping.js'

export default function ShoppingList({ selectedIds, recipes, onClose }) {
  const [checked, setChecked] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [pdfLoading, setPdfLoading] = useState(false)

  const selected = recipes.filter(r => selectedIds.includes(r.id))

  // Aggregate ingredients across all selected recipes
  const aggregated = useMemo(() => {
    const map = {}
    selected.forEach(recipe => {
      const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
      ings.forEach(ing => {
        const key = ing.name.toLowerCase().trim()
        const norm = normalizeUnit(Number(ing.amount) || 0, ing.unit)
        if (map[key]) {
          if (map[key].unit === norm.unit) {
            map[key].amount += norm.amount
          } else {
            // different units — keep as separate entries with suffix
            const altKey = key + '_' + norm.unit
            if (map[altKey]) {
              map[altKey].amount += norm.amount
            } else {
              map[altKey] = { name: ing.name.trim(), amount: norm.amount, unit: norm.unit }
            }
            return
          }
        } else {
          map[key] = { name: ing.name.trim(), amount: norm.amount, unit: norm.unit }
        }
      })
    })
    return Object.values(map)
  }, [selected])

  // Group by category
  const grouped = useMemo(() => {
    const g = {}
    aggregated.forEach(item => {
      const cat = categorizeIngredient(item.name)
      if (!g[cat]) g[cat] = []
      g[cat].push(item)
    })
    Object.keys(g).forEach(k => g[k].sort((a, b) => a.name.localeCompare(b.name)))
    return g
  }, [aggregated])

  const orderedCats = GROCERY_CATEGORIES.filter(c => grouped[c.key]?.length > 0)
  const totalItems = aggregated.length
  const checkedCount = Object.values(checked).filter(Boolean).length

  function formatDisplay(item) {
    if (!item.amount) return ''
    // Convert back from normalized cups to best unit
    if (item.unit === 'cup') {
      if (item.amount < 0.25) {
        return `${formatAmount(item.amount * 48)} tsp`
      } else if (item.amount < 0.5) {
        return `${formatAmount(item.amount * 16)} tbsp`
      }
    }
    return `${formatAmount(item.amount)} ${item.unit}`.trim()
  }

  function toggleCheck(name) {
    setChecked(c => ({ ...c, [name]: !c[name] }))
  }

  function checkAll() {
    const all = {}
    aggregated.forEach(i => all[i.name.toLowerCase()] = true)
    setChecked(all)
  }

  function uncheckAll() { setChecked({}) }

  function toggleCollapse(key) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }))
  }

  function collapseAll() {
    const all = {}
    orderedCats.forEach(c => all[c.key] = true)
    setCollapsed(all)
  }

  function expandAll() { setCollapsed({}) }

  const allCollapsed = orderedCats.every(c => collapsed[c.key])

  function copyToClipboard() {
    let text = "SHOPPIN' LIST\n"
    text += `From: ${selected.map(r => r.title).join(' · ')}\n\n`
    orderedCats.forEach(cat => {
      const items = grouped[cat.key] || []
      if (!items.length) return
      text += `── ${cat.label.toUpperCase()} ──\n`
      items.forEach(item => {
        const isChecked = checked[item.name.toLowerCase()]
        text += `  ${isChecked ? '☑' : '☐'}  ${formatDisplay(item)}  ${item.name}\n`
      })
      text += '\n'
    })
    navigator.clipboard.writeText(text).catch(() => {})
  }

  async function handlePDF() {
    setPdfLoading(true)
    try {
      await generateShoppingListPDF(selected, orderedCats, grouped, formatDisplay, checked)
    } catch (err) {
      console.error(err)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box shopping-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-content">

          <div className="shopping-header">
            <div className="modal-eyebrow">— Don't Forget —</div>
            <h2 className="modal-title">Shoppin' List</h2>
            <span className="shopping-from">
              From: {selected.map(r => r.title).join(' · ')}
            </span>

            <div className="shopping-progress-wrap">
              <div
                className="shopping-progress-bar"
                style={{ width: totalItems ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
              />
            </div>

            <div className="shopping-progress-label">
              <span>{checkedCount} of {totalItems} items checked</span>
              <div className="shopping-check-links">
                <button type="button" onClick={checkAll}>Check all</button>
                <button type="button" onClick={uncheckAll}>Uncheck</button>
                <button type="button" onClick={allCollapsed ? expandAll : collapseAll}>
                  {allCollapsed ? 'Expand all' : 'Collapse all'}
                </button>
              </div>
            </div>
          </div>

          <div className="shopping-categories">
            {orderedCats.map(cat => {
              const items = grouped[cat.key] || []
              const isCollapsed = collapsed[cat.key]
              const catChecked = items.filter(i => checked[i.name.toLowerCase()]).length

              return (
                <div key={cat.key} className={`shopping-category ${isCollapsed ? 'is-collapsed' : ''}`}>
                  <button
                    type="button"
                    className="shopping-cat-header"
                    style={{ borderLeftColor: cat.color, color: cat.color }}
                    onClick={() => toggleCollapse(cat.key)}
                  >
                    <span className="shopping-cat-icon">{cat.icon}</span>
                    <span className="shopping-cat-label" style={{ color: 'var(--ink)' }}>
                      {cat.label}
                    </span>
                    {catChecked > 0 && (
                      <span className="shopping-cat-count" style={{ background: cat.color, color: '#fff' }}>
                        {catChecked}/{items.length}
                      </span>
                    )}
                    {catChecked === 0 && (
                      <span className="shopping-cat-count">{items.length}</span>
                    )}
                    <span className="shopping-cat-chevron">{isCollapsed ? '›' : '⌄'}</span>
                  </button>

                  {!isCollapsed && (
                    <ul className="shopping-list">
                      {items.map((item, idx) => {
                        const itemKey = item.name.toLowerCase()
                        const isChecked = !!checked[itemKey]
                        return (
                          <li key={idx} className={`shopping-item ${isChecked ? 'is-checked' : ''}`}>
                            <label>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCheck(itemKey)}
                              />
                              <span className="shopping-item-amt">{formatDisplay(item)}</span>
                              <span className="shopping-item-name">{item.name}</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <div className="shopping-btns-row">
            <button type="button" className="btn-secondary" onClick={copyToClipboard}>
              📋 Copy
            </button>
            <button
              type="button"
              className="btn-primary shopping-pdf-btn"
              onClick={handlePDF}
              disabled={pdfLoading}
            >
              {pdfLoading ? '⏳ Generating…' : '📄 Print / Save PDF'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
