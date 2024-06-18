import { Dropdown } from "flowbite-react";
import { useState } from "react";

type Item = {
  label: string;
  id: string;
};

type SearchDropdownProps = {
  items: Item[];
  label: string;
  initialValue?: string;
  onChange: (item: Item) => void;
};

export function SearchDropdown({ items, label, initialValue, onChange }: SearchDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownText, setDropdownText] = useState(initialValue ? items.find((i) => i.id === initialValue)?.label : label);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="w-full flex flex-row items-center gap-4">
      <h3 className="text-lg font-medium w-full">Get documents from: </h3>
      <Dropdown
        dismissOnClick={true}
        label={dropdownText}
        style={{ flexShrink: 0 }}
      >
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        />
        {filteredItems.map((item) => (
          <Dropdown.Item
            key={item.id}
            onClick={() => {
              setDropdownText(item.label);
              onChange(item);
            }}
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown>
    </div>
  );
}