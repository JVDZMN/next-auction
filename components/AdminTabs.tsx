"use client"

import { Tab } from '@headlessui/react'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'All Users' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'bidders', label: 'Bidders' },
  { key: 'cars', label: 'Cars' },
]

export default function AdminTabs({ activeTab, setActiveTab }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <Tab.Group selectedIndex={tabs.findIndex(t => t.key === activeTab)} onChange={i => setActiveTab(tabs[i].key)}>
      <Tab.List className="flex gap-8 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <Tab
            key={tab.key}
            className={({ selected }) =>
              `py-4 px-1 border-b-2 font-medium text-sm transition-colors ` +
              (selected
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
            }
          >
            {tab.label}
          </Tab>
        ))}
      </Tab.List>
    </Tab.Group>
  )
}
