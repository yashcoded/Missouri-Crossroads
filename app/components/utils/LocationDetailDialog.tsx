"use client";

import { useMemo } from "react";
import {
    MapPin,
    Calendar,
    Tag,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Location } from "../types/types";

interface LocationDetailDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    //isSaved: boolean;
    //onToggleSave: () => void;
}

export function LocationDetailDialog({
    location,
    open,
    onOpenChange,
    //isSaved,
    //onToggleSave,
}: LocationDetailDialogProps) {
    // Move hook before early return to satisfy React Hooks rules
    const tags = useMemo(() => {
        if (!location) return [];
        return (location.tertiaryCategories || "")
            .split(/[;,]/)
            .map(t => t.trim())
            .filter(Boolean)
            .slice(0, 12);
    }, [location?.tertiaryCategories]);

    if (!location) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="flex items-start gap-2 mb-2">
                                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>{location.organizationName}</span>
                            </DialogTitle>
                            <DialogDescription>
                                {location.siteTypeCategory || "Uncategorized"}
                            </DialogDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* When I have save, uncomment this
                            <Button
                                onClick={onToggleSave}
                                variant={isSaved ? "default" : "outline"}
                                size="sm"
                            >
                                <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                                {isSaved ? "Saved" : "Save"}
                            </Button>
*/}
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="ghost"
                                size="icon"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
                    <div className="space-y-6">
                        {/* Category */}
                        <div>
                            <h4 className="mb-2">Category</h4>
                            <Badge variant="secondary">
                                {location.siteTypeCategory || "Unknown"}
                            </Badge>
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="mb-2 flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        Tags
                                    </h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {tags.map((t, i) => (
                                            <Badge key={`${t}-${i}`} variant="outline">
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Year info */}
                        {(location.yearEstablished) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {location.yearEstablished && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-muted-foreground">Year Established</div>
                                            <div>{location.yearEstablished}</div>
                                        </div>
                                    </div>
                                )}
                                {/*
                                {location.builtPlaced && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-muted-foreground">Built/Placed</div>
                                            <div>{location.builtPlaced}</div>
                                        </div>
                                    </div>
                                )}
                                */}
                            </div>
                        )}

                        <Separator />

                        {/* Address */}
                        {location.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <div className="text-muted-foreground">Address</div>
                                    <div>{location.address}</div>
                                </div>
                            </div>
                        )}

                        {/* Coordinates */}
                        {(typeof location.lat === "number" && typeof location.lng === "number") && (
                            <>
                                <Separator />
                                <div>
                                    <div className="text-muted-foreground">Coordinates</div>
                                    <div>
                                        {location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

