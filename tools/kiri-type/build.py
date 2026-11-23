"""Build the Kiri Pop color families. Run from this directory with Python + fontTools, brotli, skia-pathops."""
from io import BytesIO
from xml.etree import ElementTree
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

import pathops
from fontTools.colorLib.builder import buildCOLR, buildCPAL, populateCOLRv0
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib.tables.otTables import PaintFormat

import alphabet

OUT=alphabet.OUT
VERSION="1.002"
# palette entries: white margin, lower and upper ink, lower and upper face, reflection
PALETTES={
    "Sky":("하늘",["ffffff","42a7e7","69bdf2","acdffb","e7f6ff","ffffff"]),
    "Blue":("파랑",["ffffff","466fc6","618bdd","afc7fb","e7edff","ffffff"]),
    "Mint":("민트",["ffffff","118c89","20aaa1","a6ead8","e4fff1","ffffff"]),
    "Lilac":("라일락",["ffffff","687bce","8394e4","d5c7fc","f6efff","ffffff"]),
    "Rose":("연핑크",["ffffff","ea4578","f85d8c","f8aecb","ffe8f0","ffffff"]),
}
# Contour centers in the original artwork. One letter can contain several disconnected strokes.
LETTER_RANGES={
    "home":[("K",322,485),("i",488,550),("r",552,650)],
    "profile":[("상",290,397),("세",401,490),("프",507,593),("로",595,674),("필",679,762)],
    "work":[("업",420,503),("보",505,588)],
    "song":[("노",425,507),("래",508,592),("책",593,680)],
    "schedule":[("방",388,508),("송",510,610),("일",623,716),("정",717,816)],
}

def as_glyph(path):
    pen=TTGlyphPen(None)
    path.draw(Cu2QuPen(pen,max_err=1,reverse_direction=False))
    return pen.glyph()

def optical_face(char,face,advance):
    if char in ("업","보"):
        # Both faces are already 740 units tall. Match their visible widths and sidebearings.
        left,_,right,_=face.bounds
        width=690
        scale=width/(right-left)
        return face.transform(scale,0,0,1,95-left*scale,0),width+190
    if char=="노":
        # Separate ㄴ and ㅗ even after the two colored rims expand.
        face=pathops.Path()
        parse_path(
            "M168 746 Q168 820 247 820 Q325 820 325 746 L322 630 "
            "Q322 601 351 601 L635 605 Q716 608 717 533 Q718 459 641 457 "
            "L258 455 Q169 455 168 538 Z "
            "M108 166 C105 213 148 235 195 225 C257 213 321 209 355 213 "
            "C377 215 383 222 382 246 C380 306 390 346 439 353 "
            "C489 360 518 332 511 279 C504 229 504 217 529 217 "
            "C596 217 653 225 698 236 C748 248 780 232 788 195 "
            "C800 143 765 117 707 106 C549 74 331 72 184 96 "
            "C137 104 111 124 108 166 Z",face.getPen())
        return pathops.simplify(face,clockwise=True),901
    if char=="필":
        # Recover the original brush turns of the batchim from the profile title.
        batchim=min(face.contours,key=lambda contour:contour.bounds[1])
        trim=batchim.transform(1,0,0,1,0,0)
        trim.stroke(28,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4)
        trim.convertConicsToQuads(.5)
        batchim=combine(batchim,trim,pathops.PathOp.DIFFERENCE)
        left,bottom,right,top=batchim.bounds
        sx,sy=500/(right-left),346/(top-bottom)
        face=batchim.transform(sx,0,0,sy,186-left*sx,80-bottom*sy)
        for skeleton,weight in [
            ("M140 767 Q305 772 470 767 M143 539 Q311 535 469 541 "
             "M208 763 L210 544 M407 763 L405 544",94),
            ("M653 766 Q649 657 651 548",106),
        ]:
            stroke=pathops.Path()
            parse_path(skeleton,stroke.getPen())
            stroke.stroke(weight,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4)
            stroke.convertConicsToQuads(.5)
            face.addPath(stroke)
        return pathops.simplify(face,clockwise=True),800
    return face,advance

def lettering():
    root=ElementTree.parse(OUT/'title-ink.svg').getroot()
    originals={}
    for page,letters in LETTER_RANGES.items():
        ink=pathops.Path()
        parse_path(root.find(f"{{*}}g[@id='{page}']/{{*}}path").attrib["d"],ink.getPen())
        # The holes in the border are the actual faces. Keep their counter-contours as well.
        contours=[c for c in ink.contours if c.area<10000 or c.clockwise]
        for char,low,high in letters:
            face=pathops.Path()
            for c in contours:
                left,_,right,_=c.bounds
                if low<=(left+right)/2<high:face.addPath(c)
            left,top,right,bottom=face.bounds
            scale=min(820/(right-left),740/(bottom-top))
            baseline=450+(top+bottom)*scale/2
            if page=="home":
                # K, i and r share the cap line. Keep r at the source logo's x-height.
                scale=740/(427-270)
                baseline=450+(270+427)*scale/2
            face=face.transform(scale,0,0,-scale,95-left*scale,baseline)
            originals[char]=optical_face(char,pathops.simplify(face,clockwise=True),round(190+(right-left)*scale))
    return originals

def combine(a,b,op):
    return pathops.op(a,b,op,clockwise=True)

def edge(face,radius):
    band=face.transform(1,0,0,1,0,0)
    band.stroke(radius*2,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4)
    band.convertConicsToQuads(.5)
    return combine(face,band,pathops.PathOp.UNION)

def reflection(face,small):
    # Keep a glint inside the upper-left shoulder, with a gap to the dark rim.
    boundary=face.transform(1,0,0,1,0,0)
    boundary.stroke(14 if small else 22,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4)
    boundary.convertConicsToQuads(.5)
    core=combine(face,boundary,pathops.PathOp.DIFFERENCE)
    glint=combine(core,core.transform(1,0,0,1,14,-19),pathops.PathOp.DIFFERENCE)
    left,bottom,right,top=face.bounds
    window=pathops.Path()
    window.moveTo(left-5,top+5);window.lineTo(right+5,top+5)
    window.lineTo(right+5,top-(top-bottom)*.14);window.lineTo(left-5,top-(top-bottom)*.38);window.close()
    return combine(glint,window,pathops.PathOp.INTERSECTION)

def title_glint(face,small):
    # A curved reflection tucked inside the face, as on the Kiri cover.
    droplet=pathops.Path()
    parse_path("M0 0 C-17 12 -7 42 10 68 C32 103 65 125 80 109 C95 90 72 73 58 55 C40 32 15 -9 0 0 Z",droplet.getPen())
    left,bottom,right,top=face.bounds
    for size in ((.78,.58,.4) if small else (1.,.78,.55)):
        for yf in (.20,.25,.31,.37,.42):
            for xf in (.09,.14,.20,.27,.35,.43):
                shine=droplet.transform(size,0,0,size,left+xf*(right-left),top-yf*(top-bottom))
                inside=combine(shine,face,pathops.PathOp.INTERSECTION)
                if inside.area>shine.area*.98:
                    return inside
    return reflection(face,small)


def compound(parts,glyphs):
    pen=TTGlyphPen(glyphs)
    for name in parts:pen.addComponent(name,(1,0,0,1,0,0))
    return pen.glyph()

def paint(glyph,color,upper=None):
    if upper is None:
        fill={"Format":PaintFormat.PaintSolid,"PaletteIndex":color}
    else:
        fill={"Format":PaintFormat.PaintLinearGradient,"ColorLine":{"ColorStop":[(0,color),(1,upper)]},
              "x0":0,"y0":90,"x1":0,"y1":825,"x2":100,"y2":90}
    return {"Format":PaintFormat.PaintGlyph,"Glyph":glyph,"Paint":fill}

def make_font(originals,small_chars=None):
    small=small_chars is not None
    cmap=alphabet.cmap if not small else {ord(c):alphabet.cmap[ord(c)] for c in ' '+small_chars}
    glyphs={};metrics={};flat={};shaded={}

    def put(name,glyph,advance):
        glyph.recalcBounds(glyphs)
        glyphs[name]=glyph
        metrics[name]=(advance,getattr(glyph,"xMin",0))

    def layer_names(name):return (name+'.white',name+'.ink',name,name+'.light')

    def add(name):
        if name in glyphs:return
        base=alphabet.glyphs[name]
        advance=alphabet.metrics[name][0]
        override=originals.get(name)
        layers=layer_names(name)
        if base.isComposite() and override is None:
            parts=[part.glyphName for part in base.components]
            for part in parts:add(part)
            for i,layer in enumerate(layers):
                put(layer,compound([layer_names(part)[i] for part in parts],glyphs),advance)
        else:
            if override:face,advance=override
            else:
                face=pathops.Path()
                base.draw(face.getPen(),alphabet.glyphs)
                # Give open forms a plump face, reserving more room at stacked batchim.
                left,bottom,right,top=face.bounds
                spread=min(29,max(10,(top-bottom)*.053))
                if name.startswith("part."):
                    letter=chr(int(name.split(".")[2],16))
                    if letter in "ㄹㅌㅊㅎ" or letter in alphabet.PAIRS:
                        spread=min(spread,15)
                face=edge(face,spread)
            rim=33 if small else 47
            margin=17 if small else 38
            gloss=title_glint(face,small) if override else reflection(face,small)
            for layer,path in zip(layers,(edge(face,rim+margin),edge(face,rim),face,gloss)):
                put(layer,as_glyph(path),advance)

    put(".notdef",alphabet.glyphs[".notdef"],840)
    put("space",alphabet.glyphs["space"],360)
    for name in dict.fromkeys(cmap.values()):
        if name=="space":continue
        add(name)
        white,ink,face,light=layer_names(name)
        flat[name]=[(white,0),(ink,1),(face,3),(light,5)]
        shaded[name]={"Format":PaintFormat.PaintColrLayers,
                      "Layers":[paint(white,0),paint(ink,1,2),paint(face,3,4),paint(light,5)]}

    font=FontBuilder(1000,isTTF=True)
    font.setupGlyphOrder(list(glyphs));font.setupCharacterMap(cmap)
    font.setupGlyf(glyphs);font.setupHorizontalMetrics(metrics)
    font.setupHorizontalHeader(ascent=1020,descent=-225)
    font.setupNameTable({"familyName":"Kiri Pop","styleName":"Regular"})
    font.setupOS2(sTypoAscender=1020,sTypoDescender=-225,sTypoLineGap=0,usWinAscent=1020,usWinDescent=225,
                  usWeightClass=700,fsSelection=0x20,fsType=0,ulCodePageRange1=(1<<19)|1,ulCodePageRange2=0)
    font.font["head"].macStyle=1
    font.setupPost(keepGlyphNames=False)
    t=font.font
    t["head"].fontRevision=float(VERSION)
    t.recalcTimestamp=False;t["head"].created=t["head"].modified=3878150400
    ids=t.getReverseGlyphMap()
    t["COLR"]=buildCOLR(shaded,version=1,glyphMap=ids)
    populateCOLRv0(t["COLR"].table,flat,ids)
    return t

def colorize(font,color,small=False):
    korean,hexes=PALETTES[color]
    if small:
        # A darker, narrower rim holds the counters open on a 22px navigation label.
        nav_inks={"Blue":("385ba3","5274c4"),"Mint":("166f69","188c85"),"Lilac":("55599f","727ac3")}
        hexes=[hexes[0],*nav_inks[color],*hexes[3:]]
    palette=[tuple(int(h[i:i+2],16)/255 for i in (0,2,4))+(1.,) for h in hexes]
    font["CPAL"]=buildCPAL([palette])
    family='Kiri Pop '+color+(' Small' if small else '')
    ko_family='키리 팝 '+korean+(' 작은글씨' if small else '')
    ps=family.replace(' ','')+'-Bold'
    names=font['name']
    for lang,localized,style in [(0x409,family,'Bold'),(0x412,ko_family,'굵게')]:
        for key,value in {1:localized,2:style,3:ps+' '+VERSION,4:localized+' '+style,5:'Version '+VERSION,6:ps,
                          16:localized,17:style}.items():
            names.setName(value,key,3,1,lang)
    # Remove any earlier English Macintosh names from the shared master.
    names.names=[record for record in names.names if record.platformID!=1]
    font.flavor='woff2' if small else None
    stream=BytesIO();font.save(stream)
    return stream.getvalue()

def main():
    alphabet.build_alphabet()
    originals={alphabet.cmap[ord(char)]:outline for char,outline in lettering().items()}
    for color,text in {"Blue":"프로필","Mint":"업보","Lilac":"노래책"}.items():
        font=make_font(originals,small_chars=text)
        (OUT/f'KiriPop-{color}-Nav.woff2').write_bytes(colorize(font,color,small=True))
    master=make_font(originals)
    with ZipFile(OUT/'KiriPop-ColorFonts.zip','w',compression=ZIP_DEFLATED) as package:
        for color in PALETTES:
            entry=ZipInfo(f'KiriPop-{color}.ttf',(2026,11,23,0,0,0))
            entry.compress_type=ZIP_DEFLATED
            package.writestr(entry,colorize(master,color))

if __name__=='__main__':
    main()
