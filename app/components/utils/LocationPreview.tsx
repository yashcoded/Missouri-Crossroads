"use client";

import { MapPin, ExternalLink, Bookmark } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Location } from "./types";
import { getCategoryName } from "./CategoryFilter";
import { getCategoryBadgeClass } from "./utils/categoryColors";

interface LocationPreviewProps {
  location: Location;
  onClose: () => void;
  onOpenDetails: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function LocationPreview({ location, onClose, onOpenDetails, isSaved, onToggleSave }: LocationPreviewProps) {
  return (
    <Card className="p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 flex-1">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="mb-1">{location.name}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ×
        </button>
      </div>

      {/* Address */}
      <div className="mb-3 text-muted-foreground">
        <p>{location.address}</p>
      </div>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap mb-4">
        <Badge className={getCategoryBadgeClass(location.categories.primary)}>
          {getCategoryName(location.categories.primary, "primary")}
        </Badge>
        <Badge variant="outline">
          {getCategoryName(location.categories.secondary, "secondary")}
        </Badge>
        <Badge variant="outline">
          {getCategoryName(location.categories.tertiary, "tertiary")}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onToggleSave}
          variant={isSaved ? "default" : "outline"}
          size="sm"
          className="flex-1"
        >
          <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Button onClick={onOpenDetails} variant="outline" size="sm" className="flex-1">
          <ExternalLink className="h-4 w-4 mr-2" />
          Details
        </Button>
      </div>
    </Card>
  );
}
