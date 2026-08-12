# Product Requirements Document (PRD)

## Hotel Direct Booking Landing Page & CMS

**Version:** 1.0
**Status:** Draft
**Product Type:** Hotel Direct Booking Website
**Primary Goal:** Increase direct hotel bookings and reduce dependency on OTAs.

---

# 1. Executive Summary

Produk ini adalah platform landing page hotel yang dirancang untuk meningkatkan **direct booking** melalui website resmi hotel.

Website tidak hanya berfungsi sebagai halaman informasi hotel, tetapi sebagai **conversion-focused booking platform** yang menggabungkan:

* Hotel branding
* Visual storytelling
* Room discovery
* Direct booking benefits
* Real-time availability
* Promotions
* Reviews dan social proof
* Location information
* Booking engine integration
* Analytics
* Content Management System

Tujuan utama adalah membuat calon tamu dapat berpindah dari:

```text
Discover Hotel
      ↓
Build Trust
      ↓
Explore Rooms
      ↓
Check Availability
      ↓
Compare Benefits
      ↓
Book Direct
```

Website harus memiliki pengalaman yang cepat, mobile-first, mudah digunakan, dan mampu digunakan oleh staff hotel tanpa kemampuan teknis.

---

# 2. Business Objectives

## 2.1 Primary Objectives

### Direct Booking

Meningkatkan jumlah reservasi yang dilakukan melalui website resmi hotel.

### Reduce OTA Dependency

Mengurangi ketergantungan terhadap:

* Booking.com
* Agoda
* Expedia
* Traveloka
* OTA lainnya

Website harus memberikan alasan yang jelas bagi customer untuk melakukan booking langsung.

### Increase Conversion Rate

Meningkatkan persentase visitor yang melakukan:

```text
Visit
↓
Check Availability
↓
Booking
```

### Build Trust

Mengurangi keraguan customer dengan:

* Reviews
* Ratings
* Hotel information
* Professional photography
* Amenities
* Policies
* Location
* Social proof

### Improve Hotel Marketing

Memberikan hotel kemampuan untuk mengelola:

* Promotions
* Photos
* Rooms
* Content
* Offers
* Testimonials
* SEO metadata

tanpa membutuhkan developer.

---

# 3. Target Users

## 3.1 Leisure Traveler

Customer yang mencari hotel untuk:

* Vacation
* Weekend getaway
* Honeymoon
* Family trip
* Staycation

Prioritas:

* Visual
* Amenities
* Room experience
* Location
* Price
* Reviews

---

## 3.2 Business Traveler

Customer yang melakukan perjalanan untuk pekerjaan.

Prioritas:

* Location
* WiFi
* Workspace
* Meeting room
* Transportation
* Breakfast
* Flexible check-in/out

---

## 3.3 Family Traveler

Prioritas:

* Room capacity
* Connecting rooms
* Family rooms
* Swimming pool
* Breakfast
* Parking
* Child-friendly facilities

---

## 3.4 International Traveler

Prioritas:

* English language
* Location
* Transportation
* Airport distance
* Payment options
* Hotel policies
* Nearby attractions

---

# 4. Hotel Type

Platform harus mendukung beberapa tipe hotel.

| Hotel Type     | Primary Focus                           |
| -------------- | --------------------------------------- |
| Resort / Villa | Lifestyle, privacy, scenery, experience |
| Business Hotel | Location, WiFi, meeting facilities      |
| Budget Hotel   | Price, cleanliness, accessibility       |
| Hostel         | Community, affordability, location      |
| Boutique Hotel | Design, architecture, uniqueness        |
| Luxury Hotel   | Service, exclusivity, experience        |
| Family Hotel   | Family facilities, room capacity        |

Content yang ditampilkan dapat dikonfigurasi melalui CMS berdasarkan tipe hotel.

---

# 5. User Journey

Primary user journey:

```text
Traffic Source
      ↓
Landing Page
      ↓
Hero / First Impression
      ↓
Direct Booking Benefits
      ↓
Hotel Experience
      ↓
Rooms
      ↓
Reviews
      ↓
Location
      ↓
Check Availability
      ↓
Booking Engine
      ↓
Booking Confirmation
```

Secondary journey:

```text
Landing Page
      ↓
Promotion
      ↓
Room
      ↓
Availability
      ↓
Booking
```

---

# 6. Page Structure

Landing page minimal terdiri dari:

1. Header
2. Hero
3. Booking Widget
4. Direct Booking Benefits
5. Hotel Introduction
6. Rooms
7. Amenities
8. Gallery
9. Experiences
10. Promotions
11. Reviews
12. Location
13. Nearby Attractions
14. FAQ
15. Final CTA
16. Footer

---

# 7. Header

## Requirements

Header harus menampilkan:

* Hotel logo
* Navigation
* Language selector
* CTA Book Now

Desktop:

```text
[LOGO]

Rooms
Amenities
Gallery
Offers
Location

[EN] [BOOK NOW]
```

Mobile:

```text
[LOGO]        [MENU]
```

CTA booking dapat dibuat sticky.

---

# 8. Hero Section

Hero adalah bagian pertama yang dilihat user.

## Content

Hero dapat menggunakan:

* High-resolution image
* Video
* Image slider

Content:

* Headline
* Subheadline
* CTA
* Optional booking widget

Contoh struktur:

```text
Experience Your Stay in Yogyakarta

A peaceful escape surrounded by comfort,
culture and unforgettable experiences.

[ CHECK AVAILABILITY ]
```

## Requirements

* Responsive
* Optimized image
* Mobile-specific image
* Video fallback
* Poster image
* Lazy loading untuk non-critical media
* Accessible text contrast

---

# 9. Booking Widget

Booking widget merupakan komponen conversion utama.

## Input

Minimal:

```text
Check-in
Check-out
Guests
Rooms
Promo Code
```

CTA:

```text
CHECK AVAILABILITY
```

## Flow

```text
Select Date
     ↓
Select Guests
     ↓
Search Availability
     ↓
Display Available Rooms
```

## Requirements

* Real-time availability
* Minimum/maximum stay rules
* Occupancy rules
* Closed dates
* Rate restrictions
* Promo code
* Currency
* Loading state
* Error state

---

# 10. Direct Booking Benefits

Website harus menjelaskan alasan customer melakukan booking langsung.

Contoh:

```text
BOOK DIRECT & GET MORE

✓ Best Available Rate
✓ Free Breakfast
✓ Welcome Drink
✓ Flexible Cancellation
✓ Early Check-in
✓ Exclusive Offers
```

Benefits dapat dikonfigurasi melalui CMS.

## Optional Price Comparison

```text
OTA Price
$120

Direct Price
$108

You Save
$12
```

Harga harus berasal dari sumber yang valid dan tidak boleh menggunakan harga statis yang sudah tidak relevan.

---

# 11. Hotel Introduction

Section untuk menjelaskan identitas hotel.

Content:

* Hotel description
* Story
* Location
* Unique selling proposition
* Hotel highlights

Contoh:

```text
More Than Just a Place to Stay

Located in the heart of Yogyakarta,
our hotel combines modern comfort
with authentic local experiences.
```

CTA:

```text
DISCOVER OUR HOTEL
```

---

# 12. Hotel Highlights

Menampilkan keunggulan utama hotel.

Contoh:

```text
32 Rooms
5 min to City Center
24/7 Reception
Free WiFi
Swimming Pool
Restaurant
Airport Transfer
```

Setiap highlight dapat memiliki:

* Icon
* Title
* Description

---

# 13. Rooms Section

Menampilkan kamar yang tersedia.

Room card minimal:

```text
[IMAGE]

Deluxe King Room

32 m²
2 Guests
1 King Bed

✓ Breakfast Available
✓ Free WiFi
✓ City View

From $100 / night

[VIEW ROOM]
[CHECK AVAILABILITY]
```

## Room Data

* Room name
* Description
* Photos
* Room size
* Maximum occupancy
* Bed type
* Number of beds
* View
* Amenities
* Price
* Currency
* Cancellation policy
* Breakfast availability

---

# 14. Room Detail

Setiap room dapat memiliki detail page atau modal.

Content:

* Gallery
* Description
* Facilities
* Room size
* Occupancy
* Bed
* Bathroom
* View
* Policies
* Available rates
* CTA

CTA:

```text
CHECK AVAILABILITY
```

---

# 15. Amenities

Hotel amenities harus dapat dikelompokkan.

Contoh:

### Hotel Facilities

* Swimming Pool
* Restaurant
* Spa
* Gym
* Parking
* WiFi
* Meeting Room

### Room Facilities

* Air Conditioning
* TV
* Refrigerator
* Safe
* Hair Dryer
* Coffee Machine

Setiap amenity dapat memiliki:

* Name
* Icon
* Description
* Image

---

# 16. Gallery

Gallery harus mendukung kategori.

```text
ALL
ROOMS
FACILITIES
DINING
EXTERIOR
SURROUNDINGS
```

Features:

* Grid
* Lightbox
* Fullscreen
* Swipe
* Image zoom
* Lazy loading
* Alt text

Optional:

* Video
* 360° virtual tour

---

# 17. Experiences

Hotel tidak hanya menjual kamar.

Section ini digunakan untuk menjual pengalaman.

Contoh:

```text
Sunset Dinner
Traditional Cooking Class
Spa Experience
Pool Day
Local Cultural Tour
Romantic Dinner
```

Setiap experience dapat memiliki:

* Title
* Description
* Image
* Duration
* Price
* CTA

---

# 18. Promotions

Promotion section harus dapat dikelola melalui CMS.

Contoh:

```text
STAY 3 NIGHTS
GET 1 NIGHT FREE

15% OFF WEEKEND STAY

HONEYMOON PACKAGE

FAMILY ESCAPE PACKAGE
```

Promotion data:

* Title
* Description
* Image
* Discount
* Promo code
* Booking period
* Stay period
* Terms
* CTA
* Status

Status:

```text
Draft
Scheduled
Active
Expired
```

---

# 19. Urgency

Promotion dapat menggunakan urgency secara optional.

Contoh:

```text
Offer ends in 2 days
```

Countdown hanya boleh digunakan jika memiliki deadline nyata.

---

# 20. Social Proof

Trust signal harus ditampilkan secara prominent.

## Rating

```text
★★★★★
4.8 / 5
1,284 Reviews
```

Source:

* Google
* TripAdvisor
* Booking.com
* Agoda

## Testimonials

Data:

* Guest name
* Country
* Rating
* Review
* Date
* Source

---

# 21. Review Integration

Jika API tersedia, review dapat diintegrasikan secara live.

Jika tidak:

* Curated reviews
* Manual synchronization
* CMS management

Review source harus tetap ditampilkan secara jelas.

---

# 22. Awards & Certifications

Optional section:

```text
TripAdvisor Travelers' Choice
Google Recommended
Local Tourism Award
Sustainability Certification
```

Awards dapat dikelola dari CMS.

---

# 23. Location

Location section harus menjelaskan lokasi hotel secara visual.

Integrasi:

* Google Maps
* Coordinates
* Address
* Directions

Content:

```text
Hotel Address

Distance from:
Airport
Train Station
City Center
Tourist Attractions
Shopping Center
Beach
```

---

# 24. Nearby Attractions

Contoh:

```text
Malioboro
10 min

Yogyakarta Palace
15 min

Prambanan Temple
40 min

Yogyakarta International Airport
60 min
```

Attraction data:

* Name
* Description
* Coordinates
* Distance
* Travel time
* Category
* Image

---

# 25. Transportation

Informasi:

* Airport transfer
* Taxi
* Ride-hailing
* Train
* Bus
* Parking
* Car rental

---

# 26. FAQ

FAQ digunakan untuk menjawab pertanyaan sebelum booking.

Kategori:

### Booking

* How can I book?
* Can I modify my reservation?
* Can I cancel?

### Hotel

* What time is check-in?
* What time is check-out?
* Is breakfast included?

### Facilities

* Is parking available?
* Is WiFi free?
* Does the hotel have a swimming pool?

### Family

* Are children allowed?
* Are extra beds available?

FAQ dapat dikelola melalui CMS.

---

# 27. Final CTA

Di bagian bawah halaman harus terdapat conversion CTA.

Contoh:

```text
Ready for Your Next Stay?

Book Direct and Get Our Best Available Benefits.

[ CHECK AVAILABILITY ]
```

---

# 28. Footer

Footer minimal:

* Hotel logo
* Address
* Phone
* Email
* WhatsApp
* Social media
* Navigation
* Terms
* Privacy
* Cancellation Policy
* Sitemap
* Copyright

---

# 29. Booking Engine Integration

Platform harus mendukung integrasi dengan booking engine atau channel manager.

Potential integrations:

* Cloudbeds
* Little Hotelier
* Other booking engines
* Custom hotel booking API

Integration harus configurable.

---

# 30. Booking Engine Architecture

Landing page tidak harus mengelola seluruh booking system.

Recommended:

```text
Landing Page
     │
     ├── CMS API
     │
     ├── Analytics
     │
     └── Booking Engine
             │
             ├── Availability
             ├── Rooms
             ├── Rates
             ├── Guest Data
             ├── Payment
             └── Confirmation
```

Landing page hanya menangani discovery dan booking initiation.

Payment processing sebaiknya tetap dilakukan oleh payment provider atau booking engine yang sesuai.

---

# 31. Booking States

Booking widget harus memiliki state:

```text
Idle
Loading
Available
No Availability
Error
Invalid Date
Invalid Guest Count
```

## No Availability

Contoh:

```text
No rooms available for your selected dates.

Try another date.
```

CTA:

```text
CHANGE DATES
```

---

# 32. Error & Fallback

Jika booking engine gagal:

```text
We're temporarily unable to check availability.

Please contact our reservation team.

[WHATSAPP]
[CALL US]
```

Jika video gagal:

```text
Fallback → Static Hero Image
```

Jika Maps gagal:

```text
Fallback → Address + External Map Link
```

Website tetap harus usable meskipun third-party service mengalami gangguan.

---

# 33. CMS

CMS adalah bagian utama platform.

Staff hotel harus dapat mengelola content tanpa developer.

---

# 34. CMS Modules

## Hotel Profile

* Hotel name
* Logo
* Description
* Address
* Phone
* Email
* Social media
* Coordinates
* Check-in time
* Check-out time

## Hero

* Image
* Video
* Heading
* Subheading
* CTA

## Rooms

* Name
* Description
* Photos
* Size
* Occupancy
* Bed
* Amenities
* Rate link

## Amenities

* Name
* Icon
* Description
* Image

## Gallery

* Image
* Category
* Caption
* Sort order

## Promotions

* Title
* Description
* Discount
* Period
* Terms
* Image
* CTA

## Testimonials

* Name
* Country
* Rating
* Review
* Source

## Attractions

* Name
* Description
* Coordinates
* Distance
* Image

## FAQ

* Question
* Answer
* Category
* Sort order

## SEO

* Meta title
* Meta description
* OG title
* OG description
* OG image
* Canonical URL

---

# 35. CMS Publishing Workflow

Content status:

```text
Draft
   ↓
Preview
   ↓
Published
   ↓
Archived
```

CMS harus mendukung:

* Preview
* Publish
* Unpublish
* Schedule publishing
* Schedule expiration

---

# 36. CMS User Roles

Minimal:

| Role      | Content | Promotion | Publish | Analytics | Settings |
| --------- | ------: | --------: | ------: | --------: | -------: |
| Admin     |       ✓ |         ✓ |       ✓ |         ✓ |        ✓ |
| Marketing |       ✓ |         ✓ |       ✓ |         ✓ |        - |
| Editor    |       ✓ |         ✓ |       - |         - |        - |
| Viewer    |    Read |      Read |       - |      Read |        - |

---

# 37. Audit Log

CMS harus mencatat:

* User
* Action
* Entity
* Previous value
* New value
* Timestamp

Contoh:

```text
Marketing User

Changed:
Deluxe Room Price

From:
$120

To:
$110

12 Aug 2026 09:42
```

---

# 38. Multi-Language

Platform harus mendukung multilingual content.

Minimum:

```text
ID
EN
```

Optional:

```text
ZH
JP
KR
```

Setiap content dapat memiliki translation.

URL structure:

```text
/en/
 /id/
```

atau locale-based routing sesuai implementasi.

---

# 39. SEO

## On-Page SEO

* Title
* Meta description
* H1
* H2
* Semantic HTML
* Internal linking
* Image alt text
* Canonical URL

## Technical SEO

* Sitemap
* Robots.txt
* Canonical
* Open Graph
* Structured data
* Clean URLs
* 404 page
* Redirect management

---

# 40. Structured Data

Website harus mendukung structured data yang relevan:

```text
Hotel
HotelRoom
Offer
Review
AggregateRating
LocalBusiness
FAQPage
BreadcrumbList
```

Data harus berasal dari content yang benar-benar tersedia.

---

# 41. Location SEO

Landing page harus dapat menargetkan keyword seperti:

```text
hotel in Yogyakarta
best hotel in Yogyakarta
hotel near Malioboro
hotel near Yogyakarta Airport
luxury hotel Yogyakarta
family hotel Yogyakarta
```

Keyword strategy harus dapat disesuaikan berdasarkan hotel.

---

# 42. Analytics

Platform harus mendukung:

* Google Tag Manager
* Google Analytics
* Meta Pixel
* TikTok Pixel

Optional:

* Hotjar
* Microsoft Clarity

---

# 43. Event Tracking

Minimal event:

```text
page_view

booking_widget_view

booking_widget_open

search_availability

view_room

select_room

click_book_now

booking_started

booking_completed

view_promotion

click_promotion

view_gallery

view_virtual_tour

click_map

click_phone

click_whatsapp

click_email

view_faq
```

---

# 44. Conversion Funnel

Analytics harus dapat mengukur:

```text
Visitors
   ↓
Booking Widget Interaction
   ↓
Availability Search
   ↓
Room Selection
   ↓
Booking Started
   ↓
Booking Completed
```

Metrics:

```text
Widget Conversion Rate
Availability Search Rate
Room Selection Rate
Booking Start Rate
Booking Completion Rate
Overall Booking Conversion Rate
```

---

# 45. Performance

Website harus mobile-first.

Target:

```text
LCP < 2.5s
INP < 200ms
CLS < 0.1
```

Target page load:

```text
Initial load < 2 seconds
```

dengan koneksi mobile yang realistis.

---

# 46. Image Optimization

Semua image harus:

* Responsive
* WebP / AVIF
* Compressed
* Correct dimensions
* Lazy loaded jika non-critical
* CDN served jika tersedia
* Alt text

Hero image harus diprioritaskan karena memengaruhi LCP.

---

# 47. Video Optimization

Hero video:

* Compressed
* Poster image
* Mobile fallback
* Autoplay muted jika digunakan
* No blocking render
* CDN
* Respect reduced-motion preference

Mobile dapat menggunakan static image untuk mengurangi bandwidth.

---

# 48. Responsive Design

Support:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Prioritas:

```text
Mobile
   ↓
Tablet
   ↓
Desktop
```

CTA booking harus mudah diakses pada mobile.

---

# 49. Mobile Sticky Booking CTA

Pada mobile dapat digunakan:

```text
┌─────────────────────────────┐
│ From $100    [ BOOK NOW ]   │
└─────────────────────────────┘
```

CTA tetap visible ketika user scrolling.

---

# 50. Accessibility

Target:

**WCAG 2.1 AA**

Requirement:

* Keyboard navigation
* Focus state
* Screen reader support
* Alt text
* Color contrast
* Form labels
* Error messages
* Accessible modal
* Accessible carousel
* Reduced motion

---

# 51. Security

Requirements:

* HTTPS
* Secure headers
* Content Security Policy
* Input validation
* XSS protection
* CSRF protection where applicable
* Rate limiting
* Secure authentication
* Secure CMS sessions
* Role-based access control

Payment information tidak boleh disimpan di CMS kecuali sistem memang dirancang dan compliant untuk kebutuhan tersebut.

---

# 52. Privacy

Website harus menyediakan:

* Privacy Policy
* Cookie Policy
* Terms & Conditions
* Booking Terms
* Cancellation Policy

Jika menggunakan tracking/marketing cookies, consent mechanism harus disesuaikan dengan kebutuhan hukum dan target market.

---

# 53. Third-Party Integrations

Potential integrations:

```text
Booking Engine
Google Maps
Google Analytics
Google Tag Manager
Meta Pixel
TikTok Pixel
WhatsApp
Review Provider
Payment Provider
CDN
Email Service
```

Semua integration harus memiliki fallback jika service tidak tersedia.

---

# 54. WhatsApp Integration

CTA:

```text
Chat With Us
```

Use case:

* Booking assistance
* Room questions
* Airport transfer
* Special requests

Event:

```text
whatsapp_click
```

---

# 55. Personalization

Optional Phase 2.

Contoh:

```text
Traffic Source
      ↓
Campaign Detection
      ↓
Customized Promotion
```

Contoh:

```text
Instagram Visitor
→ Instagram Exclusive Offer
```

Google Ads visitor:

```text
→ Campaign-specific landing message
```

---

# 56. A/B Testing

Phase 2.

Variabel yang dapat diuji:

* Hero headline
* Hero image
* CTA text
* CTA position
* Direct booking benefit
* Promotion
* Room card layout
* Sticky CTA

Metrics:

```text
CTR
Availability Search Rate
Booking Start Rate
Booking Conversion Rate
```

---

# 57. Dynamic Pricing Display

Jika booking engine mendukung:

```text
From $100/night
```

Harga harus dapat diambil dari booking engine.

Hindari hardcoded pricing jika harga sering berubah.

---

# 58. Currency

Website dapat mendukung:

```text
IDR
USD
EUR
SGD
AUD
```

Namun harga final harus mengikuti currency yang tersedia pada booking engine.

---

# 59. Booking Policies

Website harus menampilkan:

* Check-in
* Check-out
* Cancellation
* Deposit
* Payment
* Children
* Extra bed
* Pets
* Smoking
* Minimum stay
* Maximum occupancy

---

# 60. Email / Booking Confirmation

Jika booking engine mendukung integration, customer harus menerima:

```text
Booking Confirmation
Booking Number
Guest Name
Room
Dates
Guests
Price
Payment Status
Cancellation Policy
Hotel Contact
```

Landing page tidak harus menangani email booking jika booking engine sudah melakukannya.

---

# 61. Operational Requirements

CMS harus mudah digunakan oleh staff non-technical.

Target:

> Staff dapat mengubah promotion atau gallery tanpa bantuan developer.

Contoh workflow:

```text
Login
↓
Promotions
↓
Edit Promotion
↓
Upload Image
↓
Set Date
↓
Preview
↓
Publish
```

Target waktu untuk update content sederhana:

**< 5 menit**

---

# 62. Content Requirements

Hotel harus menyediakan:

### Branding

* Logo
* Brand colors
* Typography
* Brand guidelines

### Photography

* Hero
* Rooms
* Facilities
* Food
* Staff
* Surroundings

### Content

* Hotel description
* Room descriptions
* Amenities
* Policies
* Promotions
* Reviews
* FAQ

### Location

* Address
* Coordinates
* Nearby attractions
* Travel time

---

# 63. Content Image Requirements

Setiap image CMS harus memiliki:

* Original image
* Optimized version
* Alt text
* Caption optional
* Category
* Sort order

CMS dapat melakukan image compression otomatis.

---

# 64. Error Pages

Minimal:

```text
404 Not Found
500 Server Error
Booking Error
Payment Error
No Availability
```

404 harus tetap memberikan navigation:

```text
[GO HOME]
[VIEW ROOMS]
[BOOK NOW]
```

---

# 65. Caching

Content hotel sebaiknya dapat di-cache.

Architecture:

```text
User
 ↓
CDN
 ↓
Landing Page
 ↓
Cached CMS Content
```

Booking availability tetap dapat dipanggil secara real-time ketika diperlukan.

---

# 66. Recommended Technical Architecture

Contoh:

```text
                ┌──────────────┐
                │    User      │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │     CDN      │
                └──────┬───────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
       Landing Page          CMS API
              │                 │
              │                 ▼
              │             Database
              │
              ▼
        Booking Engine
              │
              ▼
        Availability
              │
              ▼
           Payment
```

---

# 67. Recommended Frontend Architecture

Frontend harus menggunakan component-based architecture.

Contoh:

```text
components/
├── Header
├── Hero
├── BookingWidget
├── BookingBenefits
├── HotelIntro
├── Highlights
├── RoomList
├── RoomCard
├── Amenities
├── Gallery
├── Experiences
├── Promotions
├── Reviews
├── Location
├── Attractions
├── FAQ
├── FinalCTA
└── Footer
```

Content sebaiknya tidak hardcoded di component.

---

# 68. CMS Data Architecture

Conceptual entities:

```text
Hotel
Room
RoomAmenity
HotelAmenity
Gallery
GalleryCategory
Promotion
Testimonial
Review
Attraction
FAQ
Experience
SEO
User
Role
AuditLog
```

Relationship:

```text
Hotel
 ├── Rooms
 ├── Amenities
 ├── Gallery
 ├── Promotions
 ├── Reviews
 ├── Experiences
 ├── Attractions
 └── FAQs
```

---

# 69. Acceptance Criteria

## Hero

* [ ] Hero tampil pada mobile dan desktop
* [ ] Hero image/video dapat dikelola CMS
* [ ] Hero memiliki CTA
* [ ] Video memiliki fallback image
* [ ] Hero tidak menghambat initial rendering

## Booking

* [ ] User dapat memilih check-in
* [ ] User dapat memilih check-out
* [ ] User dapat memilih guest
* [ ] Availability dapat dicari
* [ ] Loading state tersedia
* [ ] Error state tersedia
* [ ] No availability state tersedia
* [ ] User dapat masuk ke booking engine

## Rooms

* [ ] Room dapat dikelola CMS
* [ ] Room memiliki gallery
* [ ] Room memiliki occupancy
* [ ] Room memiliki amenities
* [ ] Room memiliki CTA booking

## Promotions

* [ ] Promotion dapat dibuat
* [ ] Promotion dapat dijadwalkan
* [ ] Promotion dapat expired otomatis
* [ ] Promotion memiliki terms

## CMS

* [ ] Staff dapat login
* [ ] Staff dapat edit content
* [ ] Staff dapat upload image
* [ ] Staff dapat preview
* [ ] Staff dapat publish
* [ ] Audit log tersedia

## Analytics

* [ ] Page view tracked
* [ ] Booking CTA tracked
* [ ] Availability search tracked
* [ ] Booking start tracked
* [ ] Booking completion tracked

## SEO

* [ ] Meta title
* [ ] Meta description
* [ ] Sitemap
* [ ] Robots
* [ ] Canonical
* [ ] Structured data
* [ ] Open Graph

## Performance

* [ ] LCP < 2.5s
* [ ] INP < 200ms
* [ ] CLS < 0.1
* [ ] Images optimized
* [ ] Mobile optimized

---

# 70. Success Metrics

## Primary KPI

### Direct Booking Conversion Rate

```text
Completed Bookings
------------------- × 100
Unique Visitors
```

Target awal dapat ditentukan setelah baseline traffic tersedia.

---

## Secondary KPI

### Booking CTA CTR

```text
Book Now Clicks
---------------- × 100
Unique Visitors
```

### Availability Search Rate

```text
Availability Searches
---------------------- × 100
Unique Visitors
```

### Booking Completion Rate

```text
Completed Bookings
------------------- × 100
Booking Started
```

### Bounce Rate

Digunakan sebagai supporting metric, bukan satu-satunya indikator keberhasilan.

### Page Performance

Target:

```text
LCP < 2.5s
INP < 200ms
CLS < 0.1
```

---

# 71. MVP Scope

MVP harus mencakup:

```text
✓ Responsive Landing Page
✓ Hero
✓ Booking Widget
✓ Booking Engine Integration
✓ Direct Booking Benefits
✓ Hotel Introduction
✓ Rooms
✓ Amenities
✓ Gallery
✓ Promotions
✓ Reviews
✓ Location
✓ Attractions
✓ FAQ
✓ Final CTA
✓ CMS
✓ SEO
✓ Google Analytics / GTM
✓ Meta Pixel
✓ TikTok Pixel
✓ WhatsApp
✓ Performance Optimization
✓ Basic Accessibility
✓ Error Handling
```

---

# 72. Phase 2

Fitur berikut dapat ditambahkan setelah MVP:

```text
○ Multi-language
○ 360° Virtual Tour
○ A/B Testing
○ Personalization
○ Dynamic Campaign Landing Page
○ Advanced Analytics Dashboard
○ Customer Segmentation
○ AI Chatbot
○ WhatsApp Automation
○ Abandoned Booking Recovery
○ Loyalty Program
○ Dynamic Pricing Display
○ CRM Integration
```

---

# 73. Phase 3

Advanced platform capabilities:

```text
○ Marketing Automation
○ Customer Data Platform
○ Advanced Revenue Analytics
○ AI Recommendation
○ Automated Campaign Generation
○ Cross-property Booking
○ Multi-hotel Management
○ Centralized CMS
○ Multi-brand Management
```

---

# 74. Non-Functional Requirements

## Performance

Website harus cepat pada mobile network.

## Scalability

Architecture harus dapat berkembang dari:

```text
1 Hotel
```

menjadi:

```text
Multiple Hotels
      ↓
Hotel Groups
      ↓
Multi-property Platform
```

## Reliability

Landing page harus tetap dapat menampilkan cached hotel information apabila third-party integration mengalami gangguan.

## Maintainability

Frontend harus menggunakan reusable components.

CMS content tidak boleh hardcoded di frontend.

## Security

CMS harus menggunakan authentication dan role-based authorization.

---

# 75. Conversion Principles

Setiap section harus memiliki minimal satu tujuan.

### Hero

**Capture attention**

### Benefits

**Give reason to book direct**

### Rooms

**Help user choose**

### Reviews

**Build trust**

### Gallery

**Sell the experience**

### Location

**Remove uncertainty**

### FAQ

**Remove objections**

### Final CTA

**Convert**

Flow:

```text
ATTENTION
   ↓
INTEREST
   ↓
TRUST
   ↓
DESIRE
   ↓
ACTION
```

---

# 76. Final Product Principle

Landing page hotel bukan sekadar digital brochure.

Produk harus diperlakukan sebagai:

```text
Hotel Marketing
       +
Conversion Platform
       +
Booking Gateway
       +
Content Management System
       +
Analytics Platform
```

Prioritas utama:

```text
1. Booking Conversion
2. Trust
3. User Experience
4. Performance
5. Content Management
6. SEO
7. Analytics
8. Advanced Personalization
```

Kesuksesan produk diukur bukan dari seberapa cantik halaman hotel terlihat, tetapi dari seberapa efektif website mengubah visitor menjadi **direct booking customer**.
