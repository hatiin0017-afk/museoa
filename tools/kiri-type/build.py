"""Build the Kiri Pop color families. Run from this directory with Python + fontTools, brotli, skia-pathops."""
from io import BytesIO
from pathlib import Path
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
VERSION="1.003"
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
        left,_,right,_=face.bounds
        width=678 if char=="업" else 708
        scale=width/(right-left)
        return face.transform(scale,0,0,1,95-left*scale,0),width+190
    if char=="필":
        # Open the existing ㅍ counter around its own center. The ㄹ is the title drawing.
        counter=next(c for c in face.contours if not c.clockwise)
        left,bottom,right,top=counter.bounds
        cx,cy=(left+right)/2,(bottom+top)/2
        aperture=counter.transform(1.92,0,0,1.24,-.92*cx,-.24*cy)
        return combine(face,aperture,pathops.PathOp.DIFFERENCE),advance
    if char=="노":
        # The two strokes touch in the poster. Trim the join along its drawn slope,
        # then tuck the original ㄴ upward to leave daylight above the vowel.
        body=max(face.contours,key=lambda c:c.area)
        upper=pathops.Path()
        parse_path("M0 395 Q460 360 900 395 V900 H0 Z",upper.getPen())
        lower=pathops.Path()
        parse_path("M0 339 H343 Q366 339 379 352 Q398 373 442 373 "
                   "Q505 373 535 350 Q548 339 565 339 H900 V0 H0 Z",lower.getPen())
        consonant=combine(body,upper,pathops.PathOp.INTERSECTION)
        vowel=combine(body,lower,pathops.PathOp.INTERSECTION)
        consonant=consonant.transform(.98,0,0,.85,9,123)
        return combine(consonant,vowel,pathops.PathOp.UNION),advance
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

def make_font(originals,small_chars=None,reading=False):
    small=small_chars is not None
    cmap=alphabet.cmap if not small else {ord(c):alphabet.cmap[ord(c)] for c in ' '+small_chars}
    glyphs={};metrics={};flat={};shaded={}

    def put(name,glyph,advance):
        glyph.recalcBounds(glyphs)
        glyphs[name]=glyph
        metrics[name]=(advance,getattr(glyph,"xMin",0))

    def layer_names(name):
        if reading:return (name+'.ink',name)
        return (name+'.white',name+'.ink',name,name+'.light')

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
            if reading:
                put(layers[0],as_glyph(edge(face,9)),advance)
                put(layers[1],as_glyph(face),advance)
                return
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
        if reading:
            ink,face=layer_names(name)
            flat[name]=[(ink,0xffff),(face,0)]
            shaded[name]={"Format":PaintFormat.PaintColrLayers,
                          "Layers":[paint(ink,0xffff),paint(face,0)]}
            continue
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

def colorize(font,color,small=False,family_names=None,reading=False):
    korean,hexes=PALETTES[color]
    if small:
        # A darker, narrower rim holds the counters open on a 22px navigation label.
        nav_inks={"Blue":("385ba3","5274c4"),"Mint":("166f69","188c85"),"Lilac":("55599f","727ac3")}
        hexes=[hexes[0],*nav_inks[color],*hexes[3:]]
    palette=[tuple(int(h[i:i+2],16)/255 for i in (0,2,4))+(1.,) for h in hexes]
    font["CPAL"]=buildCPAL([[(1.,1.,1.,.10)] if reading else palette])
    family='Kiri Pop '+color+(' Small' if small else '')
    ko_family='키리 팝 '+korean+(' 작은글씨' if small else '')
    if family_names:
        family,ko_family=family_names
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

def caption_font(source,family_names,reading=False):
    # These small labels use the natural spacing and counters of the illustrated originals.
    shapes=ElementTree.parse(Path(__file__).with_name(source)).getroot()
    faces={}
    for glyph in shapes:
        face=pathops.Path()
        parse_path(glyph.attrib['d'],face.getPen())
        name=alphabet.cmap[ord(glyph.attrib['id'])]
        faces[name]=(pathops.simplify(face,clockwise=True),int(glyph.attrib['data-advance']))
    chars=''.join(glyph.attrib['id'] for glyph in shapes)
    font=make_font(faces,small_chars=chars,reading=reading)
    return colorize(font,"Blue",small=True,family_names=family_names,reading=reading)


def main():
    alphabet.build_alphabet()
    originals={alphabet.cmap[ord(char)]:outline for char,outline in lettering().items()}
    for color,text in {"Blue":"프로필","Mint":"업보","Lilac":"노래책"}.items():
        font=make_font(originals,small_chars=text)
        (OUT/f'KiriPop-{color}-Nav.woff2').write_bytes(colorize(font,color,small=True))
    (OUT/'KiriPop-Bubble.woff2').write_bytes(caption_font('bubble.svg',('Kiri Pop Bubble','키리 팝 말풍선')))
    profile=caption_font('profile-labels.svg',('Kiri Pop Profile','키리 팝 프로필'),reading=True)
    (OUT/'KiriPop-Profile.woff2').write_bytes(profile)
    master=make_font(originals)
    # Fixed stationery labels use the small-size rim. The reading face keeps the
    # same letter contours and uses the text color for small or dynamic content.
    labels="키리의작은연습실♡버츄얼방송팬캐릭터유령연주·노래프로필업보책일정월간달력상세로" + "Kkiri's profile0123456789/"
    display=make_font(originals,small_chars=labels)
    (OUT/'KiriPop-Labels.woff2').write_bytes(colorize(display,"Blue",small=True,family_names=("Kiri Pop Labels","키리 팝 문구")))
    with ZipFile(OUT/'KiriPop-ColorFonts.zip','w',compression=ZIP_DEFLATED) as package:
        for color in PALETTES:
            entry=ZipInfo(f'KiriPop-{color}.ttf',(2026,11,23,0,0,0))
            entry.compress_type=ZIP_DEFLATED
            package.writestr(entry,colorize(master,color))

    reading=make_font(originals,reading=True)
    # 0xffff follows the page's foreground, including status and selection colors.
    reading['CPAL']=buildCPAL([[(1.,1.,1.,.13)]])
    for subtable in reading['cmap'].tables:
        if subtable.isUnicode():
            for sign,source in [('’',"'"),('‹','<'),('›','>')]:
                subtable.cmap[ord(sign)]=subtable.cmap[ord(source)]
    for lang,family in [(0x409,'Kiri Pop Text'),(0x412,'키리 팝 본문')]:
        for key,value in {1:family,3:'KiriPopText-Bold '+VERSION,4:family+' Bold',
                          6:'KiriPopText-Bold',16:family}.items():
            reading['name'].setName(value,key,3,1,lang)
    reading['name'].names=[r for r in reading['name'].names if r.platformID!=1]
    reading.flavor='woff2'
    reading.save(OUT/'KiriPop-Text.woff2')

if __name__=='__main__':
    main()
