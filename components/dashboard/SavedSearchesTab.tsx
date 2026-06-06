'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

interface SavedSearch {
  id: string; label: string | null; brand: string | null; maxPrice: number | null
  minYear: number | null; fuel: string | null; notifyNewListing: boolean; createdAt: string
}

interface Props {
  savedSearches: SavedSearch[]
  onDeleted: () => void
  onAdded: () => void
}

export function SavedSearchesTab({ savedSearches, onDeleted, onAdded }: Props) {
  const [showForm,     setShowForm]     = useState(false)
  const [addingSearch, setAddingSearch] = useState(false)
  const [newSearch,    setNewSearch]    = useState({ label: '', brand: '', maxPrice: '', minYear: '', fuel: '' })

  const handleAdd = async () => {
    setAddingSearch(true)
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newSearch.label || undefined,
          brand: newSearch.brand || undefined,
          maxPrice: newSearch.maxPrice ? parseFloat(newSearch.maxPrice) : undefined,
          minYear:  newSearch.minYear  ? parseInt(newSearch.minYear)    : undefined,
          fuel: newSearch.fuel || undefined,
          notifyNewListing: true,
        }),
      })
      setNewSearch({ label: '', brand: '', maxPrice: '', minYear: '', fuel: '' })
      setShowForm(false)
      onAdded()
    } catch { /* ignore */ }
    finally { setAddingSearch(false) }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' })
    onDeleted()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Saved Searches</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add Search
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-sm">New Saved Search</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {([
                { key: 'label',    placeholder: 'Label (optional)', type: 'text'   },
                { key: 'brand',    placeholder: 'Brand (e.g. BMW)', type: 'text'   },
                { key: 'maxPrice', placeholder: 'Max price',        type: 'number' },
                { key: 'minYear',  placeholder: 'Min year',         type: 'number' },
                { key: 'fuel',     placeholder: 'Fuel type',        type: 'text'   },
              ] as const).map(({ key, placeholder, type }) => (
                <Input key={key} type={type} placeholder={placeholder}
                  value={newSearch[key]}
                  onChange={e => setNewSearch(s => ({ ...s, [key]: e.target.value }))} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={addingSearch}>{addingSearch ? 'Saving…' : 'Save Search'}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {savedSearches.length === 0 ? (
        <p className="text-muted-foreground text-sm">No saved searches yet.</p>
      ) : (
        <div className="space-y-2">
          {savedSearches.map(s => (
            <div key={s.id} className="flex justify-between items-center rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{s.label || 'Unnamed search'}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    s.brand,
                    s.maxPrice && `max ${s.maxPrice.toLocaleString('da-DK')} kr`,
                    s.minYear  && `from ${s.minYear}`,
                    s.fuel,
                  ].filter(Boolean).join(' · ') || 'Any car'}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
