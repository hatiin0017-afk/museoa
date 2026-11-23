"""Original centerlines for characters not present in the illustrated Kiri titles."""
from functools import lru_cache
from pathlib import Path

import pathops
from fontTools.misc.transform import Transform
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path

OUT = Path(__file__).resolve().parents[2] / "p/kiri/assets"
ASCENT = 925
glyphs = {}
metrics = {}
cmap = {}

# A 100-square drawing grid for each consonant. Boxes have softer corners than the crossbars.
CIRCLE = "M50 0 C79 0 100 19 100 50 S79 100 50 100 S0 81 0 50 S21 0 50 0 Z"
BOX = "M9 0 H91 Q100 0 100 9 V91 Q100 100 91 100 H9 Q0 100 0 91 V9 Q0 0 9 0 Z"
SIOT = "M51 0 Q51 50 0 100 M48 38 Q65 69 100 96"
JIEUT = "M0 0 H100 M57 1 Q54 53 0 100 M52 38 Q71 74 100 96"
CONSONANTS = {
    "ㄱ":"M0 0 H96 Q100 0 100 5 V100", "ㄴ":"M0 0 V94 Q0 100 7 100 H100",
    "ㄷ":"M100 0 H7 Q0 0 0 8 V93 Q0 100 8 100 H100",
    "ㄹ":"M0 0 H95 Q100 0 100 6 V49 H1 V94 Q1 100 8 100 H100",
    "ㅁ":BOX, "ㅂ":"M0 0 V92 Q0 100 8 100 H92 Q100 100 100 92 V0 M0 43 H100",
    "ㅅ":SIOT, "ㅇ":CIRCLE, "ㅈ":JIEUT,
    "ㅊ":"M39 0 L61 3 M0 28 H100 M56 29 Q51 64 0 100 M49 59 Q70 85 100 98",
    "ㅋ":"M0 0 H95 Q100 0 100 6 V100 M4 49 H99",
    "ㅌ":"M100 0 H7 Q0 0 0 8 V93 Q0 100 8 100 H100 M0 49 H84",
    "ㅍ":"M0 0 H100 M17 2 V98 M83 2 V98 M0 100 H100",
    "ㅎ":"M39 0 L61 3 M0 27 H100 M51 50 C79 50 90 60 90 75 S77 100 50 100 S10 90 10 75 S22 50 51 50 Z",
}
INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
VOWELS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
FINALS = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"
PAIRS = dict(zip("ㄲㄸㅃㅆㅉㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ",
                 ("ㄱㄱ","ㄷㄷ","ㅂㅂ","ㅅㅅ","ㅈㅈ","ㄱㅅ","ㄴㅈ","ㄴㅎ","ㄹㄱ","ㄹㅁ","ㄹㅂ","ㄹㅅ","ㄹㅌ","ㄹㅍ","ㄹㅎ","ㅂㅅ")))
VERTICAL = {
    "ㅏ":"M24 0 V100 M25 47 H97", "ㅑ":"M24 0 V100 M25 32 H96 M25 64 H96",
    "ㅓ":"M78 0 V100 M0 49 H78", "ㅕ":"M78 0 V100 M0 33 H78 M0 65 H78",
    "ㅐ":"M11 0 V100 M12 49 H91 M91 0 V100", "ㅒ":"M11 0 V100 M12 34 H91 M12 65 H91 M91 0 V100",
    "ㅔ":"M47 0 V100 M1 49 H47 M100 0 V100", "ㅖ":"M47 0 V100 M1 33 H47 M1 65 H47 M100 0 V100",
    "ㅣ":"M53 0 V100",
}
HORIZONTAL = {
    "ㅗ":"M0 94 H100 M50 0 V94", "ㅛ":"M0 94 H100 M33 0 V94 M67 0 V94",
    "ㅜ":"M0 6 H100 M50 6 V100", "ㅠ":"M0 6 H100 M33 6 V100 M67 6 V100",
    "ㅡ":"M0 50 H100",
}
MIXED = dict(zip("ㅘㅙㅚㅝㅞㅟㅢ",("ㅗㅏ","ㅗㅐ","ㅗㅣ","ㅜㅓ","ㅜㅔ","ㅜㅣ","ㅡㅣ")))


def draw_pieces(pieces):
    """Scale centerlines first so strokes keep their optical weight across a syllable."""
    outline = pathops.Path()
    for path, (x,y,w,h), weight in pieces:
        line = pathops.Path()
        transform = Transform(w/100,0,0,-h/100,x,ASCENT-y)
        parse_path(path,TransformPen(line.getPen(),transform))
        line.stroke(weight,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4)
        line.convertConicsToQuads(.4)
        outline.addPath(line)
    outline = pathops.simplify(outline,clockwise=True)
    outline.convertConicsToQuads(.5)
    pen = TTGlyphPen(None)
    outline.draw(Cu2QuPen(pen,max_err=1,reverse_direction=False))
    return pen.glyph()


def store(name,glyph,advance):
    glyph.recalcBounds(glyphs)
    glyphs[name]=glyph
    metrics[name]=(advance,getattr(glyph,"xMin",0))
    return name


def consonant_parts(letter,box,weight):
    x,y,w,h=box
    if letter in PAIRS:
        gap=min(115,w*.26)
        half=(w-gap)/2
        for i,part in enumerate(PAIRS[letter]):
            yield from consonant_parts(part,(x+i*(half+gap),y,half,h),min(weight,half*.33,gap*.77))
        return
    if letter=="ㅎ":
        weight=min(weight,h*.18)
    if letter=="ㅊ":
        weight=min(weight,h*.23)
    if letter in "ㄹㅂㅍㅌ":
        weight=min(weight,h*.34,w*.35)
    yield CONSONANTS[letter],box,weight


def vowel_parts(letter,box,weight):
    x,y,w,h=box
    if letter in MIXED:
        bottom,right=MIXED[letter]
        yield from vowel_parts(bottom,(x,y+h*.71,w*.63,h*.29),weight)
        yield from vowel_parts(right,(x+w*.76,y,w*.24,h),weight)
    elif letter in VERTICAL:
        if letter in "ㅔㅖ":
            weight=min(weight,w*.37)
        yield VERTICAL[letter],box,weight
    else:
        yield HORIZONTAL[letter],box,weight


@lru_cache(None)
def component(role,letter,box,weight):
    parts=vowel_parts(letter,box,weight) if role=="v" else consonant_parts(letter,box,weight)
    name=f"part.{role}.{ord(letter):x}."+".".join(map(str,(*box,weight)))
    return store(name,draw_pieces(parts),1000)


def hangul(initial,vowel,final):
    mixed=vowel in MIXED
    if vowel in HORIZONTAL:
        # Leave extra height for ㄹ and clustered batchim under stacked vowels.
        upper=(232,115,536,235) if final else (223,143,554,355)
        medial=(121,450,758,93) if final else (117,623,766,186)
        weight=83 if final else 108
    else:
        wide=vowel in "ㅔㅖㅞㅙ"
        upper=(116,132 if final else 175,358 if wide else 391,
               (177 if final else 302) if mixed else (353 if final else 536))
        medial=(117,104 if final else 126,770,436 if final else 675) if mixed else (
            (571 if wide else 636),104 if final else 126, (293 if wide else 221),436 if final else 684)
        weight=(74 if final else 86) if mixed else (88 if final else 106)
    refs=[component("c",initial,upper,weight),component("v",vowel,medial,weight)]
    if final:
        box=(190,659,620,202) if final in PAIRS else (252,649,496,216)
        if final in "ㄹㅌㅎㅊ" or any(c in PAIRS.get(final,"") for c in "ㄹㅌㅎㅊ"):
            box=(box[0],623,box[2],258)
        refs.append(component("c",final,box,80))
    pen=TTGlyphPen(glyphs)
    for name in refs:pen.addComponent(name,(1,0,0,1,0,0))
    return pen.glyph()

# Latin and figures share the soft terminals. Lowercase has its own x-height.
CAPS = {
    "A":"M0 100 L48 0 Q50 -4 53 1 L100 100 M20 65 H79",
    "B":"M0 100 V0 H50 C99 0 105 46 52 47 H1 M49 47 C111 47 111 100 50 100 H0",
    "C":"M96 14 C43 -26 0 9 0 50 S42 125 98 88",
    "D":"M0 100 V0 H35 C123 0 123 100 35 100 Z",
    "E":"M100 0 H0 V100 H100 M1 48 H78", "F":"M100 0 H0 V100 M0 49 H78",
    "G":"M95 14 C43 -25 0 10 0 50 S44 119 97 92 V56 H57",
    "H":"M0 0 V100 M100 0 V100 M0 50 H100","I":"M0 0 H100 M50 0 V100 M0 100 H100",
    "J":"M100 0 V68 C100 108 24 112 0 81","K":"M0 0 V100 M96 0 L1 55 M39 35 L100 100",
    "L":"M0 0 V100 H100","M":"M0 100 V0 L50 56 L100 0 V100","N":"M0 100 V0 L100 100 V0",
    "O":CIRCLE,"P":"M0 100 V0 H45 C114 0 114 55 45 55 H0",
    "Q":CIRCLE+" M64 71 L104 105","R":"M0 100 V0 H48 C109 0 113 51 48 52 H2 M48 52 L100 100",
    "S":"M95 12 C58 -11 3 -2 3 25 C3 49 41 48 63 53 C119 64 109 103 55 101 Q21 101 0 86",
    "T":"M0 0 H100 M50 0 V100","U":"M0 0 V63 C0 114 100 114 100 63 V0",
    "V":"M0 0 L50 100 L100 0","W":"M0 0 L22 100 L50 38 L78 100 L100 0",
    "X":"M0 0 L100 100 M100 0 L0 100","Y":"M0 0 L50 51 L100 0 M50 51 V100","Z":"M0 0 H100 L0 100 H100",
}
BOWL="M96 52 C96 22 78 4 49 4 S2 24 2 53 S21 100 48 100 S96 81 96 52 Z"
LOWER={
    "a":BOWL+" M97 5 V100","b":BOWL+" M3 -38 V100","c":"M94 14 C47 -13 2 8 2 50 S48 115 95 90",
    "d":BOWL+" M97 -38 V100","e":"M5 52 H97 C99 -10 4 -19 3 51 C3 98 50 114 94 89",
    "f":"M30 100 V-7 Q30 -43 92 -36 M0 18 H77","g":BOWL+" M97 5 V98 Q95 153 14 131",
    "h":"M3 -38 V100 M3 48 C3 -6 96 -14 96 45 V100",
    "i":"M50 -31 V-29 M50 5 V100","j":"M73 -31 V-29 M73 5 V99 Q73 140 4 135",
    "k":"M4 -38 V100 M91 4 L5 58 M41 37 L98 100","l":"M35 -38 V79 Q35 101 70 100",
    "m":"M1 6 V100 M1 44 C1 -8 49 -7 49 43 V100 M49 43 C49 -7 99 -5 99 43 V100",
    "n":"M2 5 V100 M2 47 C2 -5 97 -8 97 44 V100","o":CIRCLE,
    "p":BOWL+" M2 5 V138","q":BOWL+" M97 5 V138","r":"M3 6 V100 M3 57 Q12 3 93 3",
    "s":CAPS["S"],"t":"M37 -23 V70 Q37 108 93 97 M1 14 H87",
    "u":"M2 5 V64 C2 115 96 112 96 57 M97 5 V100","v":CAPS["V"],"w":CAPS["W"],"x":CAPS["X"],
    "y":"M0 4 L51 88 M97 4 L43 113 Q31 143 4 134","z":CAPS["Z"],
}
DIGITS={
    "0":CIRCLE,"1":"M12 22 L54 0 V100 M11 100 H94",
    "2":"M0 21 C20 -15 102 -8 98 29 Q97 46 70 63 L2 100 H100",
    "3":"M1 11 C51 -13 108 2 97 30 Q91 49 34 50 C110 44 124 101 56 101 Q22 102 0 88",
    "4":"M76 100 V0 L0 66 H100","5":"M93 0 H10 L6 46 C43 31 98 41 99 66 C103 101 45 112 1 88",
    "6":"M88 4 C26 -11 1 23 1 69 C1 112 101 113 99 68 C97 31 27 29 2 61",
    "7":"M0 0 H100 L36 100","8":"M50 0 C-9 0 -10 47 50 48 C116 51 113 100 50 100 C-17 100 -12 51 50 48 C109 47 111 0 50 0 Z",
    "9":"M11 97 C72 111 99 76 99 31 C99 -12 0 -11 1 32 C3 68 72 71 97 40",
}
SIGNS={
    ".":"M50 98 V100",",":"M61 91 L39 114",":":"M50 28 V30 M50 98 V100",
    ";":"M50 28 V30 M60 91 L37 114","!":"M50 0 V66 M50 97 V99",
    "?":"M2 19 C19 -8 91 -8 96 17 C107 47 49 47 49 70 M49 98 V100",
    "-":"M4 54 H96","–":"M0 54 H100","—":"M0 54 H100","_":"M0 102 H100",
    "/":"M95 -4 L5 104","+":"M3 50 H97 M50 14 V86","=":"M3 34 H97 M3 68 H97",
    "(":"M86 -5 Q8 49 86 107",")":"M14 -5 Q92 49 14 107",
    "'":"M55 0 L46 17",'"':"M19 0 L11 17 M90 0 L82 17",

    "#":"M37 0 L20 100 M84 0 L67 100 M8 34 H99 M1 68 H92",
    "$":CAPS["S"]+" M50 -13 V113",
    "%":"M95 0 L5 100 M25 1 C0 1 0 37 25 37 S50 1 25 1 Z M77 63 C52 63 52 99 77 99 S102 63 77 63 Z",
    "&":"M99 98 L24 36 C1 8 43 -13 62 6 C84 25 48 42 25 54 C-19 81 17 114 59 95 Q81 85 96 55",
    "*":"M50 5 V76 M5 24 L93 62 M94 24 L6 62",
    "@":"M71 43 C62 24 32 31 30 53 C27 75 58 83 70 58 L74 32 L72 64 C74 86 102 72 100 43 C99 8 72 -2 48 0 C15 1 -3 29 1 60 C5 94 45 111 82 96",
    "<":"M90 13 L10 51 L90 89",">":"M10 13 L90 51 L10 89",
    "[":"M84 -2 H22 V103 H84","]":"M16 -2 H78 V103 H16",
    "\\":"M5 -4 L95 104","^":"M3 39 L50 1 L97 39","`":"M30 0 L69 15",
    "{":"M85 -1 Q48 -3 48 19 V34 Q48 49 12 50 Q48 51 48 65 V82 Q48 104 85 102",
    "}":"M15 -1 Q52 -3 52 19 V34 Q52 49 88 50 Q52 51 52 65 V82 Q52 104 15 102",
    "|":"M50 -4 V104","~":"M1 60 Q19 36 48 51 T99 43",
    "·":"M50 54 V56","♡":"M50 94 C39 84 0 62 0 34 C0 -1 35 -6 50 20 C67 -7 101 0 100 33 C99 60 68 83 50 94 Z",
}


def add_character(char,glyph,advance):
    name=f"uni{ord(char):04X}"
    cmap[ord(char)]=store(name,glyph,advance)


def build_alphabet():
    store(".notdef",draw_pieces([(BOX,(140,200,550,560),65)]),840)
    store("space",TTGlyphPen(None).glyph(),360)
    cmap[32]=cmap[160]="space"
    for i,initial in enumerate(INITIALS):
        for j,vowel in enumerate(VOWELS):
            for k,final in enumerate(FINALS):
                code=0xAC00+(i*21+j)*28+k
                add_character(chr(code),hangul(initial,vowel,final.strip()),1000)
    for alphabet,start in [(INITIALS,0x1100),(VOWELS,0x1161),(FINALS[1:],0x11A8)]:
        for i,letter in enumerate(alphabet):
            if ord(letter) not in cmap:
                make=vowel_parts if letter in VOWELS else consonant_parts
                add_character(letter,draw_pieces(make(letter,(185,184,630,590),100)),1000)
            cmap[start+i]=cmap[ord(letter)]

    for alphabet in (CAPS,LOWER,DIGITS,SIGNS):
        for char,path in alphabet.items():
            width=490
            if char in "ilI.,:;!()'·":width=215
            if char in "rftj":width=325
            if char in "WMwm—♡":width=660
            top,height=(338,452) if alphabet is LOWER else (156,635)
            add_character(char,draw_pieces([(path,(115,top,width,height),111 if alphabet is not SIGNS else 82)]),width+230)
