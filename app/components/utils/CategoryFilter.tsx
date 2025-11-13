"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Filter, X, Search } from "lucide-react";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { getCategoryBadgeClass } from "./categoryColors";

export interface CategoryHierarchy {
    primary: string;
    secondary: string;
    tertiary: string;
}

interface TertiaryCategory {
    id: string;
    name: string;
}

interface SecondaryCategory {
    id: string;
    name: string;
    tertiary: TertiaryCategory[];
}

interface PrimaryCategory {
    id: string;
    name: string;
    secondary: SecondaryCategory[];
}

// Helper function to get category name by ID
export function getCategoryName(id: string, level: "primary" | "secondary" | "tertiary"): string {
    for (const primary of categoryData) {
        if (level === "primary" && primary.id === id) return primary.name;
        for (const secondary of primary.secondary) {
            if (level === "secondary" && secondary.id === id) return secondary.name;
            for (const tertiary of secondary.tertiary) {
                if (level === "tertiary" && tertiary.id === id) return tertiary.name;
            }
        }
    }
    return id;
}

export const categoryData: PrimaryCategory[] = [
    {
        id: "museum",
        name: "Museum",
        secondary: [
            {
                id: "museum-history",
                name: "History Museum",
                tertiary: [
                    { id: "ww2-museum", name: "World War 2" },
                    { id: "wwi-museum", name: "World War 1" },
                    { id: "ancient-history", name: "Ancient Civilizations" },
                    { id: "medieval-museum", name: "Medieval Period" },
                    { id: "women-ww2", name: "Women's World War 2" },
                ],
            },
            {
                id: "museum-art",
                name: "Art Museum",
                tertiary: [
                    { id: "modern-art", name: "Modern Art" },
                    { id: "renaissance-art", name: "Renaissance Art" },
                    { id: "contemporary-art", name: "Contemporary Art" },
                ],
            },
            {
                id: "museum-science",
                name: "Science Museum",
                tertiary: [
                    { id: "natural-history", name: "Natural History" },
                    { id: "technology-history", name: "Technology History" },
                    { id: "medical-history", name: "Medical History" },
                ],
            },
            {
                id: "museum-military",
                name: "Military Museum",
                tertiary: [
                    { id: "naval-history", name: "Naval History" },
                    { id: "aviation-history", name: "Aviation History" },
                    { id: "army-history", name: "Army History" },
                ],
            },
        ],
    },
    {
        id: "library",
        name: "Library",
        secondary: [
            {
                id: "library-research",
                name: "Research Library",
                tertiary: [
                    { id: "manuscript-collection", name: "Manuscript Collections" },
                    { id: "rare-books", name: "Rare Books" },
                    { id: "archives", name: "Historical Archives" },
                ],
            },
            {
                id: "library-public",
                name: "Historic Public Library",
                tertiary: [
                    { id: "carnegie-library", name: "Carnegie Libraries" },
                    { id: "presidential-library", name: "Presidential Libraries" },
                ],
            },
            {
                id: "library-university",
                name: "University Library",
                tertiary: [
                    { id: "special-collections", name: "Special Collections" },
                    { id: "ancient-texts", name: "Ancient Texts" },
                ],
            },
        ],
    },
    {
        id: "memorial",
        name: "Memorial",
        secondary: [
            {
                id: "memorial-war",
                name: "War Memorial",
                tertiary: [
                    { id: "ww2-memorial", name: "World War 2 Memorial" },
                    { id: "vietnam-memorial", name: "Vietnam Memorial" },
                    { id: "korean-memorial", name: "Korean War Memorial" },
                ],
            },
            {
                id: "memorial-civil-rights",
                name: "Civil Rights Memorial",
                tertiary: [
                    { id: "freedom-movement", name: "Freedom Movement" },
                    { id: "slavery-memorial", name: "Slavery & Abolition" },
                ],
            },
            {
                id: "memorial-holocaust",
                name: "Holocaust Memorial",
                tertiary: [
                    { id: "holocaust-museum", name: "Holocaust Museum" },
                    { id: "genocide-memorial", name: "Genocide Memorial" },
                ],
            },
        ],
    },
    {
        id: "archive",
        name: "Archive",
        secondary: [
            {
                id: "archive-national",
                name: "National Archive",
                tertiary: [
                    { id: "government-records", name: "Government Records" },
                    { id: "historical-documents", name: "Historical Documents" },
                ],
            },
            {
                id: "archive-local",
                name: "Local Archive",
                tertiary: [
                    { id: "city-records", name: "City Records" },
                    { id: "family-history", name: "Family History" },
                ],
            },
        ],
    },
];

interface CategoryFilterProps {
    selectedCategories: Set<string>;
    onCategoryChange: (categoryId: string, checked: boolean) => void;
    locationCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CategoryFilter({
    selectedCategories,
    onCategoryChange,
    locationCount,
    searchQuery,
    onSearchChange,
    isOpen,
    onOpenChange,
}: CategoryFilterProps) {
    const [expandedPrimary, setExpandedPrimary] = useState<Set<string>>(new Set(["museum"]));
    const [expandedSecondary, setExpandedSecondary] = useState<Set<string>>(new Set());

    const togglePrimary = (id: string) => {
        setExpandedPrimary((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSecondary = (id: string) => {
        setExpandedSecondary((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectedCount = selectedCategories.size;

    const getSelectedCategoryNames = () => {
        const selected: Array<{ id: string; name: string; level: "primary" | "secondary" | "tertiary" }> = [];
        categoryData.forEach((primary) => {
            if (selectedCategories.has(primary.id)) {
                selected.push({ id: primary.id, name: primary.name, level: "primary" });
            }
            primary.secondary.forEach((secondary) => {
                if (selectedCategories.has(secondary.id)) {
                    selected.push({ id: secondary.id, name: secondary.name, level: "secondary" });
                }
                secondary.tertiary.forEach((tertiary) => {
                    if (selectedCategories.has(tertiary.id)) {
                        selected.push({ id: tertiary.id, name: tertiary.name, level: "tertiary" });
                    }
                });
            });
        });
        return selected;
    };

    const selectedFilters = getSelectedCategoryNames();

    return (
        <>
            {/* Anchor container for search + popover */}
            <div className="relative">
                {/* Search Input - Always Visible */}
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Search & filter locations..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => onOpenChange(true)}
                    className="pl-9 pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {selectedCount > 0 && (
                        <Badge variant="secondary" className="h-6">
                            {selectedCount}
                        </Badge>
                    )}
                    <Badge variant="outline" className="h-6">
                        {locationCount}
                    </Badge>
                </div>

                {/* Filter Panel - Positioned relative to the input */}
                {isOpen && (
                    <Card className="absolute top-full mt-2 left-0 w-96 max-h-[600px] flex flex-col shadow-xl z-[10000] border-2 pointer-events-auto">
                        <div className="p-4 border-b bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    <h3>Filter by Category</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="h-7 w-7 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {selectedFilters.length > 0 && (
                            <div className="p-4 border-b bg-accent/30">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-muted-foreground">Active Filters</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            selectedFilters.forEach((filter) => {
                                                onCategoryChange(filter.id, false);
                                            });
                                        }}
                                        className="h-7 px-2"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedFilters.map((filter) => (
                                        <Badge
                                            key={filter.id}
                                            className={`${filter.level === "primary" ? getCategoryBadgeClass(filter.id) : "border"
                                                } pr-1 gap-1`}
                                            variant={filter.level === "primary" ? "default" : "outline"}
                                        >
                                            <span>{filter.name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onCategoryChange(filter.id, false)}
                                                className="h-4 w-4 p-0 hover:bg-transparent"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-2">
                                {categoryData.map((primary) => (
                                    <div key={primary.id} className="space-y-1">
                                        {/* Primary Category */}
                                        <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors">
                                            <button
                                                onClick={() => togglePrimary(primary.id)}
                                                className="flex items-center gap-2 flex-1"
                                            >
                                                {expandedPrimary.has(primary.id) ? (
                                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                                )}
                                                <span className="flex-1 text-left">{primary.name}</span>
                                            </button>
                                            <Checkbox
                                                id={primary.id}
                                                checked={selectedCategories.has(primary.id)}
                                                onCheckedChange={(checked) => onCategoryChange(primary.id, !!checked)}
                                            />
                                        </div>

                                        {/* Secondary Categories */}
                                        {expandedPrimary.has(primary.id) && (
                                            <div className="ml-6 space-y-1">
                                                {primary.secondary.map((secondary) => (
                                                    <div key={secondary.id} className="space-y-1">
                                                        <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors">
                                                            <button
                                                                onClick={() => toggleSecondary(secondary.id)}
                                                                className="flex items-center gap-2 flex-1"
                                                            >
                                                                {expandedSecondary.has(secondary.id) ? (
                                                                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                                                ) : (
                                                                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                                                )}
                                                                <span className="flex-1 text-left text-muted-foreground">
                                                                    {secondary.name}
                                                                </span>
                                                            </button>
                                                            <Checkbox
                                                                id={secondary.id}
                                                                checked={selectedCategories.has(secondary.id)}
                                                                onCheckedChange={(checked) => onCategoryChange(secondary.id, !!checked)}
                                                            />
                                                        </div>

                                                        {/* Tertiary Categories */}
                                                        {expandedSecondary.has(secondary.id) && (
                                                            <div className="ml-5 space-y-1">
                                                                {secondary.tertiary.map((tertiary) => (
                                                                    <div
                                                                        key={tertiary.id}
                                                                        className="flex items-center gap-2 p-2 hover:bg-accent/50 rounded-md transition-colors"
                                                                    >
                                                                        <Checkbox
                                                                            id={tertiary.id}
                                                                            checked={selectedCategories.has(tertiary.id)}
                                                                            onCheckedChange={(checked) => onCategoryChange(tertiary.id, !!checked)}
                                                                        />
                                                                        <label
                                                                            htmlFor={tertiary.id}
                                                                            className="flex-1 cursor-pointer text-muted-foreground"
                                                                        >
                                                                            {tertiary.name}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                )}
            </div>
        </>
    );
}

