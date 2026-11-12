/* Minimal UTF-8 ZIP writer (stored entries, CRC32). No runtime dependency. */
(function(root){
  const encoder=new TextEncoder();
  const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  function zip(entries){
    const locals=[],central=[];let offset=0;
    const header=(size,values)=>{const b=new Uint8Array(size),v=new DataView(b.buffer);for(const [at,value,width] of values)width===2?v.setUint16(at,value,true):v.setUint32(at,value,true);return b;};
    for(const [name,content] of Object.entries(entries)){
      if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.includes('..'))throw Error('Unsafe archive filename');const filename=encoder.encode(name),data=typeof content==='string'?encoder.encode(content):content;let c=0xffffffff;for(const byte of data)c=table[(c^byte)&255]^(c>>>8);const crc=(c^0xffffffff)>>>0;
      const local=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[12,33,2],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,filename.length,2]]);
      locals.push(local,filename,data);const dir=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[14,33,2],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,filename.length,2],[42,offset,4]]);central.push(dir,filename);offset+=local.length+filename.length+data.length;
    }
    const centralSize=central.reduce((n,x)=>n+x.length,0),count=Object.keys(entries).length;
    const end=header(22,[[0,0x06054b50,4],[8,count,2],[10,count,2],[12,centralSize,4],[16,offset,4]]),parts=[...locals,...central,end],out=new Uint8Array(offset+centralSize+end.length);let n=0;for(const part of parts){out.set(part,n);n+=part.length;}return out;
  }
  root.ScopeArchive={zip};if(typeof module!=='undefined')module.exports={zip};
})(typeof globalThis!=='undefined'?globalThis:this);
