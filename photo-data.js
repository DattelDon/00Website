// Shared by the photography collage and the travel globe.
// Add a photo below, then set location to an ID from locations (or omit it).
// Coordinates position the destination marker; they are not exact photo geotags.
// Each location belongs to a country; the globe reveals destinations after country selection.
window.PHOTO_DATA = {
    "countries": [
        {
            "id": "south-africa",
            "name": "South Africa",
            "label": "South Africa",
            "latitude": -30.56,
            "longitude": 22.94,
            "zoom": 2.6
        },
        {
            "id": "japan",
            "name": "Japan",
            "label": "Japan",
            "latitude": 36,
            "longitude": 138,
            "zoom": 5.2,
            "coordinateNote": "Representative central-Honshu viewpoint for the country overview"
        },
        {
            "id": "france",
            "name": "France",
            "label": "France",
            "latitude": 46,
            "longitude": 2,
            "zoom": 5.2,
            "coordinateSource": "https://www.geonames.org/3017382/france.html"
        },
        {
            "id": "morocco",
            "name": "Morocco",
            "label": "Morocco",
            "latitude": 28.5,
            "longitude": -10,
            "zoom": 4.8,
            "coordinateSource": "https://www.geonames.org/2542007/morocco.html"
        },
        {
            "id": "indonesia",
            "name": "Indonesia",
            "label": "Indonesia",
            "latitude": -5,
            "longitude": 120,
            "zoom": 3.6,
            "coordinateSource": "https://www.geonames.org/1643084/indonesia.html"
        },
        {
            "id": "switzerland",
            "name": "Switzerland",
            "label": "Switzerland",
            "latitude": 47.00016,
            "longitude": 8.01427,
            "zoom": 6,
            "coordinateSource": "https://www.geonames.org/2658434/switzerland.html"
        }
    ],
    "locations": [
        {
            "id": "south-africa",
            "name": "South Africa",
            "label": "South Africa",
            "latitude": -30.56,
            "longitude": 22.94,
            "precision": "Country-level location",
            "country": "south-africa"
        },
        {
            "id": "tanegashima",
            "name": "Tanegashima",
            "label": "Tanegashima, Japan",
            "latitude": 30.72,
            "longitude": 131.0,
            "precision": "Island-level location",
            "country": "japan"
        },
        {
            "id": "biarritz",
            "name": "Biarritz",
            "label": "Biarritz, France",
            "latitude": 43.48055,
            "longitude": -1.55684,
            "precision": "City-level location",
            "coordinateSource": "https://www.geonames.org/3032797/biarritz.html",
            "country": "france"
        },
        {
            "id": "kyoto",
            "name": "Kyoto",
            "label": "Kyoto, Japan",
            "latitude": 35.02107,
            "longitude": 135.75385,
            "precision": "City / Kyoto-area location",
            "coordinateSource": "https://www.geonames.org/1857910/kyoto.html",
            "country": "japan"
        },
        {
            "id": "anchor-point",
            "name": "Anchor Point",
            "label": "Anchor Point, Morocco",
            "latitude": 30.545044,
            "longitude": -9.725805,
            "precision": "Surf-spot area near Taghazout",
            "coordinateSource": "https://explore-agadirsoussmassa.com/en/surf-spot-anchor-point-la-pointe/",
            "country": "morocco"
        },
        {
            "id": "bali",
            "name": "Bali",
            "label": "Bali, Indonesia",
            "latitude": -8.33333,
            "longitude": 115.5,
            "precision": "Island-level location",
            "coordinateSource": "https://www.geonames.org/1650534/bali.html",
            "coordinateNote": "Representative marker shifted east to 115.5 degrees; verified inside the refined Bali outline",
            "country": "indonesia"
        },
        {
            "id": "kagoshima",
            "name": "Kagoshima",
            "label": "Kagoshima, Japan",
            "latitude": 31.56667,
            "longitude": 130.55,
            "precision": "City-level location",
            "coordinateSource": "https://www.geonames.org/1860827/kagoshima.html",
            "country": "japan"
        },
        {
            "id": "switzerland",
            "name": "Switzerland",
            "label": "Switzerland",
            "latitude": 47.00016,
            "longitude": 8.01427,
            "precision": "Country-level location",
            "coordinateSource": "https://www.geonames.org/2658434/switzerland.html",
            "country": "switzerland"
        },
        {
            "id": "tokyo",
            "name": "Tokyo",
            "label": "Tokyo, Japan",
            "latitude": 35.6895,
            "longitude": 139.69171,
            "precision": "City-level location",
            "coordinateSource": "https://www.geonames.org/1850147/tokyo.html",
            "country": "japan"
        },
        {
            "id": "taghazout",
            "name": "Taghazout",
            "label": "Taghazout, Morocco",
            "latitude": 30.54259,
            "longitude": -9.71115,
            "precision": "Village-level location",
            "coordinateSource": "https://www.geonames.org/2568012/taghazout.html",
            "country": "morocco"
        }
    ],
    "photos": [
        {
            "id": "headerjump",
            "src": "images/photography/headerjump.JPG",
            "alt": "Header",
            "location": "biarritz"
        },
        {
            "id": "bauernhaus4zu3",
            "src": "images/photography/Bauernhaus4zu3.png",
            "alt": "Farmhouse",
            "location": "kyoto"
        },
        {
            "id": "torii-in-japan",
            "src": "images/photography/Torii in Japan.JPG",
            "alt": "Torii in Japan",
            "location": "kyoto"
        },
        {
            "id": "byodoinoverlake",
            "src": "images/photography/ByodoInOverLake.png",
            "alt": "Byodo-in",
            "location": "kyoto"
        },
        {
            "id": "lichterderstadt",
            "src": "images/photography/LichterDerStadt.JPG",
            "alt": "City Lights",
            "location": "tokyo"
        },
        {
            "id": "foxy",
            "src": "images/photography/Foxy.JPG",
            "alt": "Stone Fox",
            "location": "kyoto"
        },
        {
            "id": "sunrisehochkant",
            "src": "images/photography/SunriseHochkant.png",
            "alt": "Sunrise",
            "location": "kyoto"
        },
        {
            "id": "rainbowrhinos",
            "src": "images/photography/rainbowrhinos.JPG",
            "alt": "Rhinos with Rainbow",
            "location": "south-africa"
        },
        {
            "id": "rhino",
            "src": "images/photography/rhino.JPG",
            "alt": "Rhino Silhouette",
            "location": "south-africa"
        },
        {
            "id": "elephant",
            "src": "images/photography/elephant.JPG",
            "alt": "Elephant",
            "location": "south-africa"
        },
        {
            "id": "anchorpoint",
            "src": "images/photography/anchorpoint.JPG",
            "alt": "Anchor Point",
            "location": "anchor-point"
        },
        {
            "id": "bamboooverroof",
            "src": "images/photography/BambooOverRoof.png",
            "alt": "Bamboo over Roof",
            "location": "kyoto"
        },
        {
            "id": "bluewater",
            "src": "images/photography/bluewater.JPG",
            "alt": "Blue Water",
            "location": "bali"
        },
        {
            "id": "coffee-biarritz",
            "src": "images/photography/coffee_biarritz.JPG",
            "alt": "Coffee Shop in Biarritz",
            "location": "biarritz"
        },
        {
            "id": "cottoncandysky",
            "src": "images/photography/cottoncandysky.JPG",
            "alt": "Cotton Candy Sky",
            "location": "kagoshima"
        },
        {
            "id": "dasbaenkli",
            "src": "images/photography/DASbaenkli.JPG",
            "alt": "Bench",
            "location": "switzerland"
        },
        {
            "id": "faces",
            "src": "images/photography/faces.JPG",
            "alt": "Faces",
            "location": "tokyo"
        },
        {
            "id": "firework",
            "src": "images/photography/Firework.JPG",
            "alt": "Firework",
            "location": "tokyo"
        },
        {
            "id": "franklin",
            "src": "images/photography/franklin.JPG",
            "alt": "Franklin",
            "location": "bali"
        },
        {
            "id": "gl-ckimwasser",
            "src": "images/photography/GlückImWasser.JPG",
            "alt": "Fate",
            "location": "kyoto"
        },
        {
            "id": "innocence",
            "src": "images/photography/innocence.JPG",
            "alt": "Innocence",
            "location": "kyoto"
        },
        {
            "id": "massiv",
            "src": "images/photography/massiv.JPG",
            "alt": "Massive",
            "location": "switzerland"
        },
        {
            "id": "mossyhead",
            "src": "images/photography/MossyHead.JPG",
            "alt": "Mossy Heads",
            "location": "kyoto",
            "locationNote": "Kyoto (inferred from the supplied photo order)"
        },
        {
            "id": "mountsunrise",
            "src": "images/photography/mountsunrise.JPG",
            "alt": "Mountain Sunrise",
            "location": "switzerland"
        },
        {
            "id": "paidactorseagull",
            "src": "images/photography/paidactorseagull.JPG",
            "alt": "Seagull",
            "location": "biarritz"
        },
        {
            "id": "pensador",
            "src": "images/photography/pensador.JPG",
            "alt": "In its Thoughts",
            "location": "kyoto"
        },
        {
            "id": "protectingarms",
            "src": "images/photography/protectingarms.JPG",
            "alt": "Protecting Arms",
            "location": "kyoto",
            "locationNote": "Kyoto (location to confirm)"
        },
        {
            "id": "solosurfer",
            "src": "images/photography/solosurfer.JPG",
            "alt": "Solo Surfer",
            "location": "biarritz"
        },
        {
            "id": "sunnebluemefigure",
            "src": "images/photography/SunnebluemeFigure.JPG",
            "alt": "Sunflower Statues",
            "location": "kyoto"
        },
        {
            "id": "sunsetbuddha",
            "src": "images/photography/SunsetBuddha.JPG",
            "alt": "Buddha at Sunset",
            "location": "kyoto"
        },
        {
            "id": "sunsetsurf",
            "src": "images/photography/SunSetSurf.JPG",
            "alt": "Sunset Surf",
            "location": "tokyo"
        },
        {
            "id": "surfpending",
            "src": "images/photography/surfpending.JPG",
            "alt": "Surfing",
            "location": "tokyo"
        },
        {
            "id": "surfvehicle",
            "src": "images/photography/surfvehicle.JPG",
            "alt": "Surf Vehicle",
            "location": "tanegashima"
        },
        {
            "id": "tanegashimatreetop",
            "src": "images/photography/tanegashimatreetop.JPG",
            "alt": "Tanegashima Treetop",
            "location": "tanegashima"
        },
        {
            "id": "thagazout",
            "src": "images/photography/thagazout.JPG",
            "alt": "Taghazout",
            "location": "taghazout"
        },
        {
            "id": "turmbearbeitethochformat",
            "src": "images/photography/TurmBearbeitetHochformat.JPG",
            "alt": "Hokan-ji",
            "location": "kyoto"
        }
    ]
};
