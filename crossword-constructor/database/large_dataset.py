"""
Large curated seed dataset for the crossword clue/answer database.
Organized by theme so tagging is meaningful, not random.
Each answer gets 2-4 real, varied clues across difficulty levels.
"""

# Format: (answer, display, is_proper, is_abbr, is_multiword, notoriety, theme_list, [(clue, clue_type, requires_cap)])

DATASET = [
    # ===================== FOOD & DRINK =====================
    ("OREO", "OREO", 0, 0, 0, 0.95, ["Food & Drink", "Brand Names"], [
        ("Cookie with a creme center", "straight", 0),
        ("Snack often dunked in milk", "definition", 0),
        ("Twist-apart treat", "straight", 0),
        ("Nabisco cookie since 1912", "trivia", 0),
    ]),
    ("LATTE", "LATTE", 0, 0, 0, 0.85, ["Food & Drink"], [
        ("Espresso with steamed milk", "straight", 0),
        ("Coffee shop order, often", "straight", 0),
        ("Cafe au lait alternative", "straight", 0),
    ]),
    ("TACO", "TACO", 0, 0, 0, 0.9, ["Food & Drink"], [
        ("Folded tortilla dish", "straight", 0),
        ("Tuesday night special, often", "straight", 0),
        ("Hard or soft Mexican dish", "straight", 0),
    ]),
    ("SUSHI", "SUSHI", 0, 0, 0, 0.88, ["Food & Drink"], [
        ("Raw fish on rice", "straight", 0),
        ("Japanese roll, perhaps", "straight", 0),
        ("Wasabi accompaniment", "straight", 0),
    ]),
    ("GELATO", "GELATO", 0, 0, 0, 0.7, ["Food & Drink"], [
        ("Italian frozen dessert", "straight", 0),
        ("Denser cousin of ice cream", "straight", 0),
    ]),
    ("BAGEL", "BAGEL", 0, 0, 0, 0.85, ["Food & Drink"], [
        ("Ring-shaped roll", "straight", 0),
        ("Boiled then baked bread", "trivia", 0),
        ("Lox holder", "straight", 0),
    ]),
    ("RAMEN", "RAMEN", 0, 0, 0, 0.8, ["Food & Drink"], [
        ("Noodle soup, casually", "straight", 0),
        ("College student's staple", "straight", 0),
        ("Japanese broth dish", "straight", 0),
    ]),
    ("MOCHA", "MOCHA", 0, 0, 0, 0.75, ["Food & Drink"], [
        ("Chocolate-coffee drink", "straight", 0),
        ("Espresso with cocoa", "straight", 0),
    ]),
    ("PRETZEL", "PRETZEL", 0, 0, 0, 0.75, ["Food & Drink"], [
        ("Twisted, salted snack", "straight", 0),
        ("Soft ___ (ballpark snack)", "fill_in_blank", 0),
    ]),
    ("WAFFLE", "WAFFLE", 0, 0, 0, 0.8, ["Food & Drink"], [
        ("Grid-patterned breakfast item", "straight", 0),
        ("Syrup holder, often", "straight", 0),
        ("Be indecisive, or eat a grid-patterned cake", "definition", 0),
    ]),
    ("OLIVE", "OLIVE", 0, 0, 0, 0.78, ["Food & Drink"], [
        ("Martini garnish", "straight", 0),
        ("Source of a cooking oil", "straight", 0),
        ("Branch symbolizing peace", "straight", 0),
    ]),
    ("CELERY", "CELERY", 0, 0, 0, 0.7, ["Food & Drink"], [
        ("Crunchy diet snack", "straight", 0),
        ("Stalk in a Bloody Mary", "straight", 0),
    ]),
    ("NUTMEG", "NUTMEG", 0, 0, 0, 0.55, ["Food & Drink"], [
        ("Holiday spice", "straight", 0),
        ("Eggnog flavoring", "straight", 0),
    ]),
    ("SCONE", "SCONE", 0, 0, 0, 0.65, ["Food & Drink"], [
        ("Tea-time pastry", "straight", 0),
        ("British baked good", "straight", 0),
    ]),
    ("CHILI", "CHILI", 0, 0, 0, 0.8, ["Food & Drink"], [
        ("Bean-and-meat stew", "straight", 0),
        ("Spicy bowl, often with beans", "straight", 0),
        ("Cook-off entry, perhaps", "straight", 0),
    ]),
    ("MANGO", "MANGO", 0, 0, 0, 0.75, ["Food & Drink"], [
        ("Tropical orange fruit", "straight", 0),
        ("Smoothie ingredient, often", "straight", 0),
    ]),
    ("PASTA", "PASTA", 0, 0, 0, 0.85, ["Food & Drink"], [
        ("Italian noodle dish", "straight", 0),
        ("Penne or rigatoni", "straight", 0),
    ]),
    ("BACON", "BACON", 0, 0, 0, 0.9, ["Food & Drink"], [
        ("Breakfast strip", "straight", 0),
        ("BLT component", "straight", 0),
        ("Pork belly, cured and sliced", "definition", 0),
    ]),
    ("SALSA", "SALSA", 0, 0, 0, 0.8, ["Food & Drink", "Music"], [
        ("Chip companion", "straight", 0),
        ("Latin dance style", "straight", 0),
        ("Tomato-based dip", "straight", 0),
    ]),
    ("TOFU", "TOFU", 0, 0, 0, 0.7, ["Food & Drink"], [
        ("Soy-based protein", "straight", 0),
        ("Bean curd", "definition", 0),
    ]),

    # ===================== BRAND NAMES =====================
    ("APPLE", "APPLE", 0, 0, 0, 0.97, ["Brand Names", "Food & Drink"], [
        ("iPhone maker", "straight", 0),
        ("Newton's reported inspiration", "trivia", 0),
        ("Teacher's traditional gift", "straight", 0),
        ("Big Tech giant founded in a garage", "trivia", 0),
    ]),
    ("IPOD", "IPOD", 0, 0, 0, 0.85, ["Brand Names"], [
        ("Discontinued Apple music player", "straight", 1),
        ("Click wheel device, once", "trivia", 1),
    ]),
    ("NIKE", "NIKE", 1, 0, 0, 0.85, ["Brand Names"], [
        ("Swoosh maker", "straight", 1),
        ("Greek goddess of victory", "trivia", 1),
        ("\"Just Do It\" company", "straight", 1),
    ]),
    ("LEGO", "LEGO", 1, 0, 0, 0.85, ["Brand Names"], [
        ("Building block brand", "straight", 1),
        ("Danish toy company", "trivia", 1),
    ]),
    ("KLEENEX", "KLEENEX", 1, 0, 0, 0.7, ["Brand Names"], [
        ("Tissue brand used generically", "straight", 1),
        ("Genericized trademark for tissue", "trivia", 1),
    ]),
    ("XEROX", "XEROX", 1, 0, 0, 0.65, ["Brand Names"], [
        ("Copier brand, used as a verb", "straight", 1),
        ("\"Make a copy,\" informally", "definition", 1),
    ]),
    ("GOOGLE", "GOOGLE", 1, 0, 0, 0.95, ["Brand Names"], [
        ("Search giant", "straight", 1),
        ("\"Look it up online,\" informally", "definition", 1),
        ("Alphabet subsidiary", "trivia", 1),
    ]),
    ("AMAZON", "AMAZON", 1, 0, 0, 0.9, ["Brand Names", "Geography"], [
        ("Online retail giant", "straight", 1),
        ("World's longest river, by some measures", "trivia", 1),
        ("Prime seller", "straight", 1),
    ]),
    ("ADIDAS", "ADIDAS", 1, 0, 0, 0.75, ["Brand Names"], [
        ("Three-stripe sportswear brand", "straight", 1),
        ("Puma rival", "straight", 1),
    ]),
    ("PEPSI", "PEPSI", 1, 0, 0, 0.8, ["Brand Names", "Food & Drink"], [
        ("Coke rival", "straight", 1),
        ("Cola brand with a blue logo", "straight", 1),
    ]),

    # ===================== U.S. PRESIDENTS =====================
    ("OBAMA", "OBAMA", 1, 0, 0, 0.96, ["U.S. Presidents"], [
        ("44th U.S. president", "straight", 1),
        ("Michelle's husband", "straight", 1),
        ("\"Audacity of Hope\" author", "trivia", 1),
    ]),
    ("LINCOLN", "LINCOLN", 1, 0, 0, 0.95, ["U.S. Presidents"], [
        ("16th U.S. president", "straight", 1),
        ("Gettysburg Address deliverer", "trivia", 1),
        ("Honest Abe", "straight", 1),
        ("Ford's Theatre attendee, fatefully", "trivia", 1),
    ]),
    ("REAGAN", "REAGAN", 1, 0, 0, 0.85, ["U.S. Presidents"], [
        ("40th U.S. president", "straight", 1),
        ("Former actor turned politician", "trivia", 1),
        ("\"Tear down this wall\" speaker", "trivia", 1),
    ]),
    ("CLINTON", "CLINTON", 1, 0, 0, 0.85, ["U.S. Presidents"], [
        ("42nd U.S. president", "straight", 1),
        ("Hillary's husband", "straight", 1),
    ]),
    ("KENNEDY", "KENNEDY", 1, 0, 0, 0.88, ["U.S. Presidents"], [
        ("35th U.S. president", "straight", 1),
        ("JFK, formally", "straight", 1),
        ("Dallas motorcade figure, tragically", "trivia", 1),
    ]),
    ("NIXON", "NIXON", 1, 0, 0, 0.8, ["U.S. Presidents"], [
        ("37th U.S. president", "straight", 1),
        ("Only president to resign", "trivia", 1),
        ("Watergate figure", "straight", 1),
    ]),
    ("WASHINGTON", "WASHINGTON", 1, 0, 0, 0.95, ["U.S. Presidents", "Geography"], [
        ("First U.S. president", "straight", 1),
        ("Capital on the Potomac", "straight", 1),
        ("State bordering Oregon", "straight", 1),
        ("Face on the dollar bill", "trivia", 1),
    ]),
    ("TRUMAN", "TRUMAN", 1, 0, 0, 0.7, ["U.S. Presidents"], [
        ("33rd U.S. president", "straight", 1),
        ("\"The buck stops here\" president", "trivia", 1),
    ]),
    ("CARTER", "CARTER", 1, 0, 0, 0.65, ["U.S. Presidents"], [
        ("39th U.S. president", "straight", 1),
        ("Peanut farmer turned president", "trivia", 1),
    ]),
    ("MADISON", "MADISON", 1, 0, 0, 0.65, ["U.S. Presidents", "Geography"], [
        ("4th U.S. president", "straight", 1),
        ("Wisconsin's capital", "straight", 1),
        ("\"Father of the Constitution\"", "trivia", 1),
    ]),

    # ===================== GEOGRAPHY =====================
    ("NILE", "NILE", 1, 0, 0, 0.9, ["Geography"], [
        ("Longest river in Africa", "straight", 1),
        ("River through Cairo", "straight", 1),
        ("River that floods the delta", "straight", 1),
    ]),
    ("SEINE", "SEINE", 1, 0, 0, 0.75, ["Geography"], [
        ("River through Paris", "straight", 1),
        ("Waterway past the Eiffel Tower", "straight", 1),
    ]),
    ("THAMES", "THAMES", 1, 0, 0, 0.78, ["Geography"], [
        ("River through London", "straight", 1),
        ("Waterway by Big Ben", "straight", 1),
    ]),
    ("ANDES", "ANDES", 1, 0, 0, 0.65, ["Geography"], [
        ("South American mountain range", "straight", 1),
        ("Mountains running through Peru", "straight", 1),
    ]),
    ("ALPS", "ALPS", 1, 0, 0, 0.8, ["Geography"], [
        ("European mountain range", "straight", 1),
        ("Skiing destination range", "straight", 1),
        ("Matterhorn's range", "trivia", 1),
    ]),
    ("SAHARA", "SAHARA", 1, 0, 0, 0.85, ["Geography"], [
        ("World's largest hot desert", "straight", 1),
        ("African desert", "straight", 1),
    ]),
    ("TOKYO", "TOKYO", 1, 0, 0, 0.92, ["Geography"], [
        ("Japan's capital", "straight", 1),
        ("World's most populous metro area", "trivia", 1),
    ]),
    ("PARIS", "PARIS", 1, 0, 0, 0.95, ["Geography"], [
        ("France's capital", "straight", 1),
        ("City of Light", "straight", 1),
        ("Eiffel Tower's city", "trivia", 1),
    ]),
    ("CAIRO", "CAIRO", 1, 0, 0, 0.8, ["Geography"], [
        ("Egypt's capital", "straight", 1),
        ("City near the pyramids", "straight", 1),
    ]),
    ("DALLAS", "DALLAS", 1, 0, 0, 0.85, ["Geography"], [
        ("Texas city on the Trinity", "straight", 1),
        ("Cowboys' home city", "straight", 1),
        ("JFK's assassination site", "trivia", 1),
    ]),
    ("AUSTIN", "AUSTIN", 1, 0, 0, 0.8, ["Geography"], [
        ("Texas's capital", "straight", 1),
        ("Live Music Capital of the World", "trivia", 1),
    ]),
    ("HOUSTON", "HOUSTON", 1, 0, 0, 0.82, ["Geography"], [
        ("Space City", "straight", 1),
        ("Texas's largest city", "straight", 1),
        ("\"___, we have a problem\"", "fill_in_blank", 1),
    ]),
    ("DENVER", "DENVER", 1, 0, 0, 0.75, ["Geography"], [
        ("Mile High City", "straight", 1),
        ("Colorado's capital", "straight", 1),
    ]),
    ("BOSTON", "BOSTON", 1, 0, 0, 0.85, ["Geography"], [
        ("Massachusetts's capital", "straight", 1),
        ("Site of a famous tea party", "trivia", 1),
        ("Red Sox home city", "straight", 1),
    ]),
    ("VENICE", "VENICE", 1, 0, 0, 0.85, ["Geography"], [
        ("Italian canal city", "straight", 1),
        ("City with no roads, basically", "definition", 1),
    ]),
    ("BERLIN", "BERLIN", 1, 0, 0, 0.85, ["Geography"], [
        ("Germany's capital", "straight", 1),
        ("Site of a famous wall", "trivia", 1),
    ]),
    ("MOSCOW", "MOSCOW", 1, 0, 0, 0.85, ["Geography"], [
        ("Russia's capital", "straight", 1),
        ("Kremlin's city", "straight", 1),
    ]),
    ("NEWYORK", "NEW YORK", 1, 0, 1, 0.97, ["Geography"], [
        ("Empire State", "straight", 1),
        ("Home of the Yankees and Mets", "straight", 1),
        ("Big Apple's state", "trivia", 1),
    ]),

    # ===================== 90S POP CULTURE =====================
    ("ERNIE", "ERNIE", 1, 0, 0, 0.85, ["90s Pop Culture"], [
        ("Bert's roommate", "straight", 1),
        ("___ and Bert", "fill_in_blank", 1),
        ("Rubber duckie owner", "trivia", 1),
    ]),
    ("ELSA", "ELSA", 1, 0, 0, 0.8, ["90s Pop Culture"], [
        ("Frozen queen with icy powers", "straight", 1),
        ("Lion in \"Born Free\"", "trivia", 1),
        ("\"Let It Go\" singer, in-universe", "trivia", 1),
    ]),
    ("SEUSS", "SEUSS", 1, 0, 0, 0.88, ["Classic Literature", "90s Pop Culture"], [
        ("\"Cat in the Hat\" author, familiarly", "straight", 1),
        ("Children's rhyming author", "straight", 1),
        ("Grinch's creator", "trivia", 1),
    ]),
    ("OPRAH", "OPRAH", 1, 0, 0, 0.9, ["90s Pop Culture"], [
        ("Talk show legend", "straight", 1),
        ("Media mogul with a book club", "trivia", 1),
        ("\"You get a car!\" host", "trivia", 1),
    ]),
    ("SEINFELD", "SEINFELD", 1, 0, 0, 0.8, ["90s Pop Culture"], [
        ("Sitcom \"about nothing\"", "trivia", 1),
        ("Jerry's eponymous show", "straight", 1),
    ]),
    ("FRIENDS", "FRIENDS", 0, 0, 0, 0.85, ["90s Pop Culture"], [
        ("90s sitcom set in NYC", "straight", 0),
        ("Show with Ross and Rachel", "trivia", 0),
        ("Central Perk regulars", "trivia", 0),
    ]),
    ("NSYNC", "N SYNC", 0, 0, 1, 0.7, ["90s Pop Culture", "Music"], [
        ("Timberlake's old boy band", "trivia", 1),
        ("\"Bye Bye Bye\" group", "trivia", 1),
    ]),
    ("SPICE", "SPICE GIRLS", 0, 0, 0, 0.6, ["90s Pop Culture", "Music"], [
        ("___ Girls (90s pop group)", "fill_in_blank", 0),
        ("\"___ up your life\"", "fill_in_blank", 0),
    ]),
    ("TAMAGOTCHI", "TAMAGOTCHI", 1, 0, 0, 0.55, ["90s Pop Culture"], [
        ("Virtual pet on a keychain", "definition", 1),
        ("90s digital pet toy", "straight", 1),
    ]),
    ("BEANIE", "BEANIE BABY", 0, 0, 0, 0.55, ["90s Pop Culture"], [
        ("___ Baby (90s collectible)", "fill_in_blank", 0),
        ("Stuffed-animal collectible craze", "straight", 0),
    ]),

    # ===================== CLASSIC LITERATURE =====================
    ("ATTICUS", "ATTICUS", 1, 0, 0, 0.75, ["Classic Literature"], [
        ("\"To Kill a Mockingbird\" lawyer", "trivia", 1),
        ("Finch family patriarch", "trivia", 1),
    ]),
    ("GATSBY", "GATSBY", 1, 0, 0, 0.8, ["Classic Literature"], [
        ("\"Great\" Fitzgerald title character", "trivia", 1),
        ("Daisy's pursuer in a Fitzgerald novel", "trivia", 1),
    ]),
    ("HAMLET", "HAMLET", 1, 0, 0, 0.85, ["Classic Literature"], [
        ("Shakespearean prince of Denmark", "trivia", 1),
        ("\"To be or not to be\" speaker", "trivia", 1),
        ("Yorick's addresser", "trivia", 1),
    ]),
    ("ORWELL", "ORWELL", 1, 0, 0, 0.78, ["Classic Literature"], [
        ("\"1984\" author", "trivia", 1),
        ("\"Animal Farm\" novelist", "trivia", 1),
    ]),
    ("AUSTEN", "AUSTEN", 1, 0, 0, 0.78, ["Classic Literature"], [
        ("\"Pride and Prejudice\" author", "trivia", 1),
        ("Jane who wrote about Mr. Darcy", "trivia", 1),
    ]),
    ("TWAIN", "TWAIN", 1, 0, 0, 0.78, ["Classic Literature"], [
        ("\"Huckleberry Finn\" author", "trivia", 1),
        ("Mark who wrote about the Mississippi", "trivia", 1),
    ]),
    ("POE", "POE", 1, 0, 0, 0.75, ["Classic Literature"], [
        ("\"The Raven\" poet", "trivia", 1),
        ("Edgar Allan ___", "fill_in_blank", 1),
        ("Master of the macabre, in letters", "definition", 1),
    ]),
    ("ODYSSEY", "ODYSSEY", 1, 0, 0, 0.7, ["Classic Literature"], [
        ("Homer's epic about Ulysses", "trivia", 1),
        ("Long, eventful journey, or a Homer epic", "definition", 1),
    ]),

    # ===================== MUSIC =====================
    ("CELLO", "CELLO", 0, 0, 0, 0.7, ["Music"], [
        ("Large bowed string instrument", "straight", 0),
        ("Orchestra section between viola and bass", "straight", 0),
    ]),
    ("OBOE", "OBOE", 0, 0, 0, 0.6, ["Music"], [
        ("Double-reed woodwind", "straight", 0),
        ("Instrument that tunes the orchestra", "trivia", 0),
    ]),
    ("BANJO", "BANJO", 0, 0, 0, 0.7, ["Music"], [
        ("Bluegrass string instrument", "straight", 0),
        ("Five-string twangy instrument", "straight", 0),
    ]),
    ("TUBA", "TUBA", 0, 0, 0, 0.65, ["Music"], [
        ("Largest brass instrument", "straight", 0),
        ("Marching band's low brass", "straight", 0),
    ]),
    ("ARIA", "ARIA", 0, 0, 0, 0.7, ["Music"], [
        ("Operatic solo", "straight", 0),
        ("Showcase song for one singer", "definition", 0),
    ]),
    ("BEYONCE", "BEYONCE", 1, 0, 0, 0.85, ["Music"], [
        ("\"Single Ladies\" singer", "trivia", 1),
        ("Queen Bey", "straight", 1),
        ("Jay-Z's spouse", "trivia", 1),
    ]),
    ("ELVIS", "ELVIS", 1, 0, 0, 0.88, ["Music"], [
        ("The King of Rock and Roll", "straight", 1),
        ("Graceland owner", "trivia", 1),
        ("\"Hound Dog\" singer", "trivia", 1),
    ]),
    ("MADONNA", "MADONNA", 1, 0, 0, 0.82, ["Music"], [
        ("\"Like a Virgin\" singer", "trivia", 1),
        ("Material Girl singer", "straight", 1),
    ]),

    # ===================== WORDPLAY MECHANICS (anagram/homophone examples) =====================
    ("ANAGRAM", "ANAGRAM", 0, 0, 0, 0.6, ["Wordplay: Anagram"], [
        ("Word puzzle using rearranged letters", "definition", 0),
        ("\"Stop\" rearranged into \"pots,\" e.g.", "wordplay", 0),
        ("Letter-scramble puzzle", "definition", 0),
    ]),
    ("ETUI", "ETUI", 0, 0, 0, 0.3, [], [
        ("Small sewing kit case", "definition", 0),
        ("Needle holder", "definition", 0),
    ]),
    ("NAIVE", "NAIVE", 0, 0, 0, 0.6, [], [
        ("Innocently unsophisticated", "definition", 0),
        ("Lacking worldly experience", "definition", 0),
    ]),
    ("EERIE", "EERIE", 0, 0, 0, 0.55, [], [
        ("Spooky and strange", "definition", 0),
        ("Unsettling, as silence", "definition", 0),
    ]),
    ("OASIS", "OASIS", 0, 0, 0, 0.65, ["Geography", "Music"], [
        ("Desert watering hole", "definition", 0),
        ("\"Wonderwall\" band", "trivia", 1),
        ("Fertile desert spot", "straight", 0),
    ]),

    # ===================== BEGINNER-FRIENDLY GENERIC FILL (grid glue words) =====================
    ("ERA", "ERA", 0, 0, 0, 0.7, ["Beginner-Friendly"], [
        ("Period of time", "definition", 0),
        ("Baseball stat for pitchers, briefly", "abbreviation", 0),
    ]),
    ("ERAS", "ERAS", 0, 0, 0, 0.6, ["Beginner-Friendly"], [
        ("Time periods", "definition", 0),
        ("Taylor Swift's ___ Tour", "fill_in_blank", 1),
    ]),
    ("ALOE", "ALOE", 0, 0, 0, 0.65, ["Beginner-Friendly", "Food & Drink"], [
        ("Sunburn remedy plant", "straight", 0),
        ("Succulent in many lotions", "straight", 0),
    ]),
    ("ADIEU", "ADIEU", 0, 0, 0, 0.45, [], [
        ("French farewell", "straight", 0),
        ("\"Goodbye,\" to the French", "definition", 0),
    ]),
    ("OTTO", "OTTO", 1, 0, 0, 0.45, [], [
        ("Palindromic name", "trivia", 1),
        ("German king's name", "straight", 1),
    ]),
    ("ANA", "ANA", 1, 0, 0, 0.4, [], [
        ("Palindromic girl's name", "trivia", 1),
        ("Common Spanish first name", "straight", 1),
    ]),
    ("IDEA", "IDEA", 0, 0, 0, 0.7, ["Beginner-Friendly"], [
        ("Lightbulb moment", "straight", 0),
        ("Brainstorm result", "straight", 0),
    ]),
    ("EPEE", "EPEE", 0, 0, 0, 0.4, [], [
        ("Fencing sword", "definition", 0),
        ("Thin dueling blade", "definition", 0),
    ]),
    ("ULNA", "ULNA", 0, 0, 0, 0.45, [], [
        ("Forearm bone", "definition", 0),
        ("Bone near the radius", "definition", 0),
    ]),
    ("IOTA", "IOTA", 0, 0, 0, 0.5, [], [
        ("Tiny amount", "definition", 0),
        ("Greek letter, or a smidgen", "definition", 0),
    ]),
    ("OREGANO", "OREGANO", 0, 0, 0, 0.65, ["Food & Drink"], [
        ("Pizza herb", "straight", 0),
        ("Italian seasoning", "straight", 0),
    ]),
    ("UMBRELLA", "UMBRELLA", 0, 0, 0, 0.8, ["Beginner-Friendly"], [
        ("Rain protector", "straight", 0),
        ("Rihanna hit, with \"ella ella\"", "trivia", 0),
    ]),
    ("PUZZLE", "PUZZLE", 0, 0, 0, 0.7, ["Beginner-Friendly"], [
        ("Jigsaw or crossword, e.g.", "definition", 0),
        ("Brain teaser", "definition", 0),
    ]),
    ("ROBOT", "ROBOT", 0, 0, 0, 0.75, ["Beginner-Friendly"], [
        ("Mechanical worker", "definition", 0),
        ("AI-powered machine", "straight", 0),
    ]),
    ("GALAXY", "GALAXY", 0, 0, 0, 0.75, ["Beginner-Friendly"], [
        ("Milky Way, e.g.", "straight", 0),
        ("Collection of billions of stars", "definition", 0),
    ]),
    ("VOLCANO", "VOLCANO", 0, 0, 0, 0.8, ["Beginner-Friendly"], [
        ("Mountain that erupts", "definition", 0),
        ("Lava source", "straight", 0),
    ]),
    ("PENGUIN", "PENGUIN", 0, 0, 0, 0.8, ["Beginner-Friendly"], [
        ("Flightless Antarctic bird", "straight", 0),
        ("Tuxedo-look bird", "straight", 0),
    ]),
    ("CACTUS", "CACTUS", 0, 0, 0, 0.75, ["Beginner-Friendly"], [
        ("Spiny desert plant", "straight", 0),
        ("Plant that needs little water", "definition", 0),
    ]),
    ("RAINBOW", "RAINBOW", 0, 0, 0, 0.8, ["Beginner-Friendly"], [
        ("Arc of colors after rain", "definition", 0),
        ("Pot of gold's reported location", "trivia", 0),
    ]),
    ("DOLPHIN", "DOLPHIN", 0, 0, 0, 0.8, ["Beginner-Friendly"], [
        ("Intelligent marine mammal", "straight", 0),
        ("Flipper, e.g.", "trivia", 0),
    ]),

    # ===================== ABBREVIATIONS =====================
    ("ASAP", "ASAP", 0, 1, 0, 0.6, ["Beginner-Friendly"], [
        ("\"Right away,\" for short", "abbreviation", 0),
        ("Urgently, in an acronym", "abbreviation", 0),
    ]),
    ("ETA", "ETA", 0, 1, 0, 0.65, ["Beginner-Friendly"], [
        ("Arrival estimate, briefly", "abbreviation", 0),
        ("Flight info abbr.", "abbreviation", 0),
    ]),
    ("CEO", "CEO", 0, 1, 0, 0.7, ["Beginner-Friendly"], [
        ("Top boss, for short", "abbreviation", 0),
        ("Company head, briefly", "abbreviation", 0),
    ]),
    ("FAQ", "FAQ", 0, 1, 0, 0.55, [], [
        ("Help page section, for short", "abbreviation", 0),
        ("Common questions list, briefly", "abbreviation", 0),
    ]),
    ("DIY", "DIY", 0, 1, 0, 0.6, [], [
        ("\"Do it yourself,\" briefly", "abbreviation", 0),
        ("Home-project approach, for short", "abbreviation", 0),
    ]),
    ("USB", "USB", 0, 1, 0, 0.6, [], [
        ("Common computer port, for short", "abbreviation", 0),
        ("Flash drive connector, briefly", "abbreviation", 0),
    ]),
    ("ATM", "ATM", 0, 1, 0, 0.7, [], [
        ("Cash machine, for short", "abbreviation", 0),
        ("Bank kiosk, briefly", "abbreviation", 0),
    ]),

    # ===================== SCIENCE/NATURE (rounding out fill) =====================
    ("OZONE", "OZONE", 0, 0, 0, 0.6, [], [
        ("Atmospheric layer gas", "definition", 0),
        ("O3, chemically", "straight", 0),
    ]),
    ("QUARTZ", "QUARTZ", 0, 0, 0, 0.55, [], [
        ("Common crystal mineral", "definition", 0),
        ("Watch movement type", "trivia", 0),
    ]),
    ("ECLIPSE", "ECLIPSE", 0, 0, 0, 0.7, [], [
        ("Sun-blocking celestial event", "definition", 0),
        ("Moon-shadow event", "definition", 0),
    ]),
    ("GRAVITY", "GRAVITY", 0, 0, 0, 0.7, [], [
        ("Force that pulls things down", "definition", 0),
        ("What goes up must come down, due to this", "definition", 0),
    ]),
    ("OXYGEN", "OXYGEN", 0, 0, 0, 0.65, [], [
        ("Element we breathe", "definition", 0),
        ("O on the periodic table", "straight", 0),
    ]),
]


def build_inserts():
    """Convert DATASET into the SQL insert lists used by the loader."""
    answers, clues, answer_theme_links, clue_theme_links = [], [], [], []
    for ans, disp, proper, abbr, multi, notor, themes, clue_list in DATASET:
        length = len(ans)
        answers.append((ans, disp, length, proper, abbr, multi, notor))
        for theme in themes:
            answer_theme_links.append((ans, theme))
        for clue_text, ctype, cap in clue_list:
            clues.append((ans, clue_text, ctype, cap))
            for theme in themes:
                clue_theme_links.append((clue_text, theme))
    return answers, clues, answer_theme_links, clue_theme_links


if __name__ == "__main__":
    a, c, at, ct = build_inserts()
    print(f"Answers: {len(a)}")
    print(f"Clues: {len(c)}")
    print(f"Answer-theme links: {len(at)}")
    print(f"Clue-theme links: {len(ct)}")
