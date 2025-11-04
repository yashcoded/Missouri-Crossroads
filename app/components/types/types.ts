// app/lib/types.ts

export interface Location {
    id: string; // unique identifier, can be derived from row index or filename+index
    organizationName: string; // 'Organization OR Place > Civic Structure > Museum OR Place > LocalBusiness > Library'
    siteType?: string; // 'SITE, ORG, MON OR MKR?'
    siteTypeCategory: string; // 'SITE TYPE CATEGORY'
    tertiaryCategories?: string; // 'TERTIARY CATS'
    yearEstablished?: string; // 'YEAR ESTABLISHED, BUILT OR PLACED?'
    affiliation?: string; // 'affiliations'
    address?: string; // 'address OR postalAddress (streetAddress OR postOfficeBoxNumber)'
    addressLocality?: string; // 'addressLocality'
    county?: string; // 'COUNTY'
    postalCode?: string; // 'postalCode'
    geoCoordinatesDMM?: string; // 'GeoCoordinates (DMM)'
    lat?: number; // from 'GeoCoordinates (DD)'
    lng?: number; // from 'GeoCoordinates (DD)'
    status?: string; // 'STATUS'
    telephone?: string; // 'telephone'
    email?: string; // 'email'
    website?: string; // 'WEBSITE'

    // Facebook data
    facebookPage?: string; // 'FACEBOOK PAGE'
    facebookFollowers?: number; // 'FB PAGE FOLLOWERS'
    facebookLikes?: number; // 'FB PAGE LIKES'
    facebookGroupMembers?: number; // 'FB GROUP MEMBERS'

    // Twitter data
    twitter?: string; // 'TWITTER'

    // Instagram data
    instagram?: string; // 'INSTAGRAM'

    // Archival / metadata
    dataDate?: string; // 'DATA DATE'
    nrhpNominationForm?: string; // 'NRHP NOMINATION FORM'

    // For UI use
    image?: string; // optional local or remote image
}



