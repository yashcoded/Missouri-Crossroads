"use client";

import { Bookmark, MapPin, Trash2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Location } from "../types/types";

import { AspectRatio } from "../ui/aspect-ratio";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getCategoryBadgeClass } from "./categoryColors";

interface SavedLocationsViewProps {
  savedLocations: Location[];
  onLocationSelect: (location: Location) => void;
  onRemoveSaved: (locationId: string) => void;
  selectedLocation: Location | null;
  onCategoryClick: (categoryId: string) => void;
}

export function SavedLocationsView({
  savedLocations,
  onLocationSelect,
  onRemoveSaved,
  selectedLocation,
  onCategoryClick,
}: SavedLocationsViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <Bookmark className="h-5 w-5 text-primary" />
          <h3>Saved Locations</h3>
        </div>
        <p className="text-muted-foreground">
          {savedLocations.length} {savedLocations.length === 1 ? "location" : "locations"} saved
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3" onWheel={(e) => e.stopPropagation()}>
          {savedLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-1">No saved locations yet</p>
              <p>Click the bookmark icon on any location to save it</p>
            </div>
          ) : (
            savedLocations.map((location) => (
              <div
                key={location.id}
                className={`rounded-lg border transition-all ${
                  selectedLocation?.id === location.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card"
                }`}
              >
                {/* Image */}
                {location.image && (
                  <button
                    onClick={() => onLocationSelect(location)}
                    className="w-full overflow-hidden rounded-t-lg"
                  >
                    <AspectRatio ratio={16 / 9}>
                      <ImageWithFallback
                        src={location.image || ""}
                        alt={location.organizationName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </AspectRatio>
                  </button>
                )}

                <div className="p-3">
                  {/* Title */}
                  <button
                    onClick={() => onLocationSelect(location)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <h4 className="flex-1">{location.organizationName}</h4>
                    </div>
                  </button>

                  {/* Description */}
                  {location.address && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {location.address}
                    </p>
                  )}

                  {/* Categories */}
                  {(location.siteTypeCategory || location.tertiaryCategories) && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {location.siteTypeCategory && (
                        <Badge 
                          className={`${getCategoryBadgeClass(location.siteTypeCategory)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick(location.siteTypeCategory || "");
                          }}
                        >
                          {location.siteTypeCategory}
                        </Badge>
                      )}
                      {location.tertiaryCategories && (
                        <Badge 
                          variant="outline"
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick(location.tertiaryCategories || "");
                          }}
                        >
                          {location.tertiaryCategories.split(/[;,]/)[0]?.trim() || location.tertiaryCategories}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveSaved(location.id)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from Saved
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
