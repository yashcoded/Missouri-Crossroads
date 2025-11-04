"use client";

import { MapPin, Calendar, Building2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import type { Location } from "../types/types";

interface LocationListSidebarProps {
    locations: Location[];
    selectedLocation: Location | null;
    onLocationSelect: (location: Location) => void;
    onCategoryClick: (categoryId: string) => void;

    // toggle controls
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LocationListSidebar({
    locations,
    selectedLocation,
    onLocationSelect,
    onCategoryClick,
    isOpen,
    onOpenChange,
}: LocationListSidebarProps) {
    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => onOpenChange(false)}
                />
            )}

            <div
                className={[
                    "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l shadow-xl transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full", // <- reversed direction
                ].join(" ")}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="mb-1 font-semibold">Locations</h3>
                    <button
                        className="text-sm underline text-muted-foreground hover:text-foreground"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3" onWheel={(e) => e.stopPropagation()}>
                        {locations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No locations match your filters</p>
                            </div>
                        ) : (
                            locations.map((location) => {
                                const tags =
                                    (location.tertiaryCategories || "")
                                        .split(/[;,]/)
                                        .map((t) => t.trim())
                                        .filter(Boolean)
                                        .slice(0, 6);

                                return (
                                    <div
                                        key={location.id}
                                        className={`rounded-lg border transition-all ${selectedLocation?.id === location.id
                                                ? "border-primary bg-accent"
                                                : "border-border bg-card hover:border-primary/50"
                                            }`}
                                    >
                                        <button
                                            onClick={() => onLocationSelect(location)}
                                            className="w-full text-left"
                                        >
                                            <div className="p-3">
                                                <div className="flex items-start gap-2 mb-1">
                                                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                                    <h4 className="flex-1">{location.organizationName}</h4>
                                                </div>

                                                {location.address && (
                                                    <p className="text-muted-foreground mb-3 line-clamp-2">
                                                        {location.address}
                                                    </p>
                                                )}

                                                {(location.yearEstablished || location.affiliation) && (
                                                    <div className="space-y-1 mb-3">
                                                        {location.yearEstablished && (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>Est. {location.yearEstablished}</span>
                                                            </div>
                                                        )}
                                                        {location.affiliation && (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Building2 className="h-3 w-3" />
                                                                <span className="line-clamp-1">
                                                                    {location.affiliation}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {(location.siteTypeCategory || tags.length > 0) && (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {location.siteTypeCategory && (
                                                            <Badge
                                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onCategoryClick(location.siteTypeCategory!);
                                                                }}
                                                            >
                                                                {location.siteTypeCategory}
                                                            </Badge>
                                                        )}
                                                        {tags.map((t, i) => (
                                                            <Badge
                                                                key={`${location.id}-${t}-${i}`}
                                                                variant="outline"
                                                                className="cursor-pointer hover:bg-accent transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onCategoryClick(t);
                                                                }}
                                                            >
                                                                {t}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
}

