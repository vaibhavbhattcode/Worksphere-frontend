// Reusable LocationInput with Open-Meteo geocoding suggestions
import React, { useState } from "react";
import axios from "axios";
import { FaMapMarkerAlt } from "react-icons/fa";

const LocationInput = ({
  value,
  onChange,
  placeholder = "Enter city",
  className = "",
  requireSelection = false,
  onValidityChange,
}) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showError, setShowError] = useState(false);

  const toFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return "";
    const code = countryCode.toUpperCase();
    const A = 0x1f1e6;
    return String.fromCodePoint(A + (code.charCodeAt(0) - 65), A + (code.charCodeAt(1) - 65));
  };

  const formatSuggestion = (item) => {
    const a = item.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.hamlet || "";
    const state = a.state || a.region || a.county || "";
    const country = a.country || "";
    const parts = [];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    const label = parts.join(", ");
    const flag = toFlag(a.country_code);
    return { label: label || item.display_name, flag };
  };

  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    try {
      const q = encodeURIComponent(searchQuery);
      const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=8&language=en&format=json`;
      const openMeteoAxios = axios.create();
      const meteoRes = await openMeteoAxios.get(openMeteoUrl, {
        timeout: 6000,
        signal: controller.signal,
        withCredentials: false,
      });

      const results = [];
      if (meteoRes?.data?.results) {
        meteoRes.data.results.forEach((r) => {
          const address = {
            city: r.name,
            state: r.admin1 || r.admin2 || "",
            country: r.country || "",
            country_code: (r.country_code || "").toLowerCase(),
          };
          results.push({
            place_id: `om_${r.id}`,
            address,
            display_name: `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`,
            type: "city",
          });
        });
      }

      const seen = new Set();
      const deduped = [];
      for (const item of results) {
        const { label } = formatSuggestion(item);
        const key = (label || "").toLowerCase();
        if (!label || seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
      }

      setSuggestions(deduped.slice(0, 10));
    } catch (err) {
      if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
      // Fallback small set
      const fallback = [
        { place_id: "fallback_1", address: { city: "Mumbai", state: "MH", country: "India", country_code: "in" }, display_name: "Mumbai, MH, India", type: "city" },
        { place_id: "fallback_2", address: { city: "Delhi", state: "Delhi", country: "India", country_code: "in" }, display_name: "Delhi, India", type: "city" },
        { place_id: "fallback_3", address: { city: "Bengaluru", state: "KA", country: "India", country_code: "in" }, display_name: "Bengaluru, KA, India", type: "city" },
        { place_id: "fallback_4", address: { city: "Gurgaon", state: "HR", country: "India", country_code: "in" }, display_name: "Gurgaon, HR, India", type: "city" },
      ];
      const filtered = fallback.filter((s) => s.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
      setSuggestions(filtered);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    if (selectedLocation && newVal !== selectedLocation) {
      setSelectedLocation("");
    }
    setQuery(newVal);
    onChange?.(newVal);
    if (requireSelection) {
      const valid = false;
      onValidityChange?.(valid);
      setShowError(false);
    }
    if (newVal.length >= 2) fetchSuggestions(newVal); else setSuggestions([]);
  };

  const handleSelect = (formatted) => {
    onChange?.(formatted);
    setQuery(formatted);
    setSelectedLocation(formatted);
    setSuggestions([]);
    setActiveIndex(-1);
    if (requireSelection) {
      onValidityChange?.(true);
      setShowError(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const { label } = formatSuggestion(suggestions[activeIndex]);
      handleSelect(label);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const highlight = (text, q) => {
    if (!q) return text;
    try {
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-900 px-0.5 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="relative" role="combobox" aria-expanded={suggestions.length > 0} aria-haspopup="listbox">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (requireSelection) {
              const valid = query.trim() === "" ? false : query === selectedLocation;
              onValidityChange?.(valid);
              setShowError(!valid && query.trim() !== "");
              if (!valid && selectedLocation) {
                // snap back to last selected suggestion
                setQuery(selectedLocation);
                onChange?.(selectedLocation);
                setShowError(false);
                onValidityChange?.(true);
              }
            }
          }}
          aria-invalid={requireSelection && showError}
          className={`pl-10 pr-10 py-3 rounded-lg border ${requireSelection && showError ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full ${className}`}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="location-suggestions"
        />
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <FaMapMarkerAlt className="w-4 h-4" />
        </span>
        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange?.("");
              setSuggestions([]);
              setActiveIndex(-1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Clear location"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      {loading && <p className="text-xs text-gray-500 mt-1">Loading…</p>}
      {suggestions.length > 0 && (
        <ul id="location-suggestions" role="listbox" className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-auto">
          {suggestions.map((item, index) => {
            const { label, flag } = formatSuggestion(item);
            const isActive = index === activeIndex;
            return (
              <li
                key={`${item.place_id}-${index}`}
                role="option"
                aria-selected={isActive}
                className={`px-3 py-2 text-gray-700 dark:text-gray-200 cursor-pointer transition-colors duration-150 flex items-center justify-between ${isActive ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200" : "hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-200"}`}
                onMouseDown={() => handleSelect(label)}
              >
                <span className="truncate pr-2">{highlight(label, query)}</span>
                {flag && <span className="ml-2 text-base">{flag}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {requireSelection && showError && (
        <p className="mt-1 text-sm text-red-600">Please select a city from suggestions.</p>
      )}
    </div>
  );
};

export default LocationInput;
