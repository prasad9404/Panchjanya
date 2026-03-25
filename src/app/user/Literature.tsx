import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Bookmark,
  Search,
  MoreVertical,
  BookOpen,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { db } from "@/auth/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useLanguage } from "@/shared/contexts/LanguageContext";

interface Book {
  id: string;
  title: string;
  titleHindi: string;
  author: string;
  authorHindi: string;
  description: string;
  descriptionHindi: string;
  category: string;
  coverImage: string;
  pdfUrl?: string; // Optional for now
}

export default function Literature() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [books, setBooks] = useState<Book[]>([]);

  const categories = [
    { id: "all", label: t("literature.all") },
    { id: "spiritual", label: t("literature.spiritual") },
    { id: "history", label: t("literature.history") },
    { id: "literature", label: t("literature.philosophy") },
  ];

  // Default books to ensure UI shows something (matching image) even if DB is empty
  const defaultBooks: Book[] = [
    {
      id: "1",
      title: "Shrimad Bhagavad Gita",
      titleHindi: "श्रीमद्भगवद्गीता",
      author: "Vyasa Muni",
      authorHindi: "व्यास मुनी",
      description: t('literature.gitaDesc'),
      descriptionHindi:
        "मानवी जीवनाचे सार आणि कर्तव्याचे मार्गदर्शन करणारा पवित्र ग्रंथ.",
      category: "spiritual",
      coverImage:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
    },
    {
      id: "2",
      title: "Bhavārth Dīpikā (Jñāneśvarī)",
      titleHindi: "भावार्थ दीपिका (ज्ञानेश्वरी)",
      author: "Sant Jñāneśvar",
      authorHindi: "संत ज्ञानेश्वर",
      description: t('literature.jnanesvariDesc'),
      descriptionHindi:
        "भगवद्गीतेवर मराठी भाषेत केलेले ओघवते आणि अमृततुल्य भाष्य.",
      category: "spiritual",
      coverImage:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    },
    {
      id: "3",
      title: "Shivaji Maharaj: Management Guru",
      titleHindi: "शिवाजी महाराज: मॅनेजमेंट गुरू",
      author: "Namdev Rao Jadhav",
      authorHindi: "नामदेवराव जाधव",
      description: t('literature.shivajiDesc'),
      descriptionHindi:
        "छत्रपती शिवाजी महाराजांच्या व्यवस्थापन कौशल्यांचे सखोल...",
      category: "history",
      coverImage:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
    },
  ];

  // Fetch books
  useEffect(() => {
    let q;
    if (activeCategory === "all") {
      q = query(collection(db, "books"));
    } else {
      // Map table category from 'tattvagyan' to 'literature' if needed, or just strict match
      // Since defaulting to mock data if empty, let's just query
      q = query(
        collection(db, "books"),
        where("category", "==", activeCategory),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // If DB empty, fallback to local default books filter
        const filtered =
          activeCategory === "all"
            ? defaultBooks
            : defaultBooks.filter(
                (b) =>
                  b.category === activeCategory ||
                  (activeCategory === "literature" &&
                    b.category === "philosophy"),
              ); // Handle potential mismatch

        // Only set if we actually have matches, else keep empty array
        if (filtered.length > 0) setBooks(filtered);
        else setBooks([]); // Or keep defaultBooks if verifying UI

        // FOR VERIFICATION: Always set mock data if DB empty
        if (snapshot.empty) {
          const filteredDefaults =
            activeCategory === "all"
              ? defaultBooks
              : defaultBooks.filter((b) => b.category === activeCategory);
          setBooks(filteredDefaults);
        }
      } else {
        const booksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Book[];
        setBooks(booksData);
      }
    });

    return () => unsubscribe();
  }, [activeCategory]);

  // Filter books by search
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.titleHindi?.includes(searchQuery) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorHindi?.includes(searchQuery),
  );

  // Group books by category
  const groupedBooks = filteredBooks.reduce(
    (acc, book) => {
      const category = book.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(book);
      return acc;
    },
    {} as Record<string, Book[]>,
  );

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "spiritual":
        return t("literature.spiritualTitle");
      case "history":
        return t("literature.historyTitle");
      case "literature":
      case "philosophy":
        return t("literature.philosophyTitle");
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  return (
    <div className="min-h-full flex-1 lg: font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between /95 lg:/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 hover:bg-black/5"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-7 h-7 text-blue-900" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">
          {t("literature.title")}
        </h1>
        <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5">
          <Bookmark className="w-6 h-6 text-blue-900" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder={t("literature.searchPlaceholder")}
            className="pl-12 pr-4 h-12 rounded-2xl border-gray-100 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-200 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-5 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all border ${
                activeCategory === category.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-blue-500 border-blue-100 hover:bg-blue-50"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-6">
        {Object.entries(groupedBooks).map(([category, categoryBooks]) => (
          <div key={category} className="mb-10">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-lg text-blue-700">
                {getCategoryTitle(category)}
              </h2>
              <button className="text-xs font-bold text-amber-500 hover:text-amber-600">
                {t("literature.viewAll")}
              </button>
            </div>

            {/* Books List */}
            <div className="space-y-5">
              {categoryBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl p-4 ring-1 ring-gray-50/50 hover:shadow-lg transition-all cursor-pointer relative group"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  {/* Kebab Menu */}
                  <button className="absolute top-4 right-3 text-gray-300 hover:text-gray-500">
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <div className="w-28 h-[8.5rem] flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 relative">
                      <div className="absolute inset-0 border border-black/5 rounded-lg z-10 pointer-events-none"></div>
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/300x400/e2e8f0/475569?text=Book";
                        }}
                      />
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0 py-1 flex flex-col">
                      <h3 className="font-heading font-bold text-blue-600 text-[1.05rem] leading-tight mb-1 pr-6">
                        {book.titleHindi}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        {book.authorHindi}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-auto line-clamp-2 font-medium">
                        {book.descriptionHindi}
                      </p>

                      <Button
                        className="bg-[#4361ee] hover:bg-blue-700 text-white rounded-lg px-6 h-9 text-xs font-bold w-fit mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/book/${book.id}`);
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-2 opacity-90" />
                        {t("literature.readNow")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && books.length > 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Search className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-slate-600 font-medium mb-1">
              {t("literature.noBooksFound")}
            </p>
            <p className="text-xs text-slate-400">
              {t("literature.tryAnotherSearch")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
