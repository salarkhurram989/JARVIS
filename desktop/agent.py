import json, os, platform, socket, subprocess, webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
HOST = "127.0.0.1"; PORT = 8765
MEMORY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "memory.json")
APPS = {"chrome":[os.path.expandvars(r"%PROGRAMFILES%\\Google\\Chrome\\Application\\chrome.exe"),os.path.expandvars(r"%PROGRAMFILES(X86)%\\Google\\Chrome\\Application\\chrome.exe")],"edge":[os.path.expandvars(r"%PROGRAMFILES(X86)%\\Microsoft\\Edge\\Application\\msedge.exe"),os.path.expandvars(r"%PROGRAMFILES%\\Microsoft\\Edge\\Application\\msedge.exe")],"notepad":["notepad.exe"],"calculator":["calc.exe"],"explorer":["explorer.exe"],"vscode":[os.path.expandvars(r"%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe"),os.path.expandvars(r"%PROGRAMFILES%\\Microsoft VS Code\\bin\\code.cmd")]}
def reply(h,code,data):
    raw=json.dumps(data,ensure_ascii=False).encode("utf-8"); h.send_response(code); h.send_header("Content-Type","application/json; charset=utf-8"); h.send_header("Content-Length",str(len(raw))); h.send_header("Access-Control-Allow-Origin","*"); h.send_header("Access-Control-Allow-Methods","GET, POST, OPTIONS"); h.send_header("Access-Control-Allow-Headers","Content-Type"); h.end_headers(); h.wfile.write(raw)
def mem():
    try:
        with open(MEMORY_FILE,"r",encoding="utf-8") as f: return json.load(f)
    except Exception: return []
def save(items):
    with open(MEMORY_FILE,"w",encoding="utf-8") as f: json.dump(items[-100:],f,ensure_ascii=False,indent=2)
def system():
    d={"computer":socket.gethostname(),"windows":platform.platform(),"cpu":platform.processor(),"machine":platform.machine()}
    try:
        import psutil; d.update({"ram_gb":round(psutil.virtual_memory().total/1073741824,2),"ram_used_percent":psutil.virtual_memory().percent,"disk_free_gb":round(psutil.disk_usage(os.environ.get("SystemDrive","C:")+"\\").free/1073741824,2)})
    except Exception: pass
    return d
def find(term):
    out=[]; term=term.lower(); root=os.path.expanduser("~")
    for base,dirs,files in os.walk(root):
        dirs[:]=[x for x in dirs if x not in ("AppData","$Recycle.Bin","System Volume Information")]
        for n in files:
            if term in n.lower(): out.append(os.path.join(base,n))
            if len(out)>=40: return out
    return out
def command(c):
    t=c.strip(); l=t.lower()
    if l in ("system scan","scan my pc","pc status","system status"): return {"ok":True,"type":"system","data":system()}
    if l.startswith("open "):
        target=t[5:].strip(); key=target.lower()
        if key in APPS:
            for p in APPS[key]:
                if os.path.exists(p) or p in ("notepad.exe","calc.exe","explorer.exe"): subprocess.Popen([p],shell=False); return {"ok":True,"message":"Opening "+key+"."}
            return {"ok":False,"message":"I could not find "+key+" on this PC."}
        p=os.path.expandvars(os.path.expanduser(target.strip(chr(34))))
        if os.path.exists(p): os.startfile(p); return {"ok":True,"message":"Opening "+p}
        return {"ok":False,"message":"I could not find that app or folder."}
    if l.startswith("find ") or l.startswith("search for "):
        term=t[5:] if l.startswith("find ") else t[11:]; r=find(term.strip()); return {"ok":True,"type":"files","results":r,"message":"Found "+str(len(r))+" matching files."}
    if l.startswith("remember "):
        a=mem(); a.append({"text":t[9:].strip()}); save(a); return {"ok":True,"message":"I will remember that locally."}
    if l in ("what do you remember","show memory","my memory"): return {"ok":True,"type":"memory","items":mem()}
    if l.startswith("google "):
        webbrowser.open("https://www.google.com/search?q="+t[7:].replace(" ","+")); return {"ok":True,"message":"Opening Google search."}
    if l.startswith("git status") or l.startswith("dev status"):
        p=os.getcwd()
        try: out=subprocess.check_output(["git","-C",p,"status","--short","--branch"],stderr=subprocess.STDOUT,text=True,timeout=10); return {"ok":True,"type":"git","message":out.strip() or "Git repository is clean."}
        except Exception as e: return {"ok":False,"message":"Git status failed: "+str(e)}
    return {"ok":False,"type":"unknown","message":"Let Gemini handle this request."}
class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self): reply(self,204,{})
    def do_GET(self):
        if urlparse(self.path).path=="/health": reply(self,200,{"ok":True,"agent":"JARVIS PC Agent","version":"2.0"})
        elif urlparse(self.path).path=="/system": reply(self,200,{"ok":True,"data":system()})
        else: reply(self,404,{"ok":False})
    def do_POST(self):
        if urlparse(self.path).path!="/command": reply(self,404,{"ok":False}); return
        try: n=int(self.headers.get("Content-Length","0")); b=json.loads(self.rfile.read(n).decode("utf-8")); r=command(b.get("command","")); reply(self,200 if r.get("ok") else 400,r)
        except Exception as e: reply(self,500,{"ok":False,"message":str(e)})
    def log_message(self,*args): pass
if __name__=="__main__": print("JARVIS PC Agent: http://127.0.0.1:8765"); HTTPServer((HOST,PORT),Handler).serve_forever()