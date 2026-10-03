const toggle=document.querySelector('.mobile-toggle');
const nav=document.querySelector('.nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });
}
document.querySelectorAll('.filter-chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    const row=chip.closest('.filter-row');
    row?.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
  });
});
const search=document.querySelector('#home-search');
const searchForm=document.querySelector('#rank-search');
if(search){
  const cards=[...document.querySelectorAll('.category-card')];
  const empty=document.querySelector('#search-empty');
  const runSearch=(shouldScroll=false)=>{
    const q=search.value.trim().toLowerCase();
    let visible=0;
    cards.forEach(card=>{
      const haystack=((card.dataset.search||'')+' '+card.textContent).toLowerCase();
      const hit=!q||haystack.includes(q);
      card.classList.toggle('hidden',!hit);
      card.classList.toggle('search-hit',Boolean(q&&hit));
      if(hit) visible++;
    });
    empty?.classList.toggle('hidden',visible!==0);
    if(shouldScroll&&q) document.querySelector('#categories')?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  search.addEventListener('input',()=>runSearch(false));
  searchForm?.addEventListener('submit',e=>{e.preventDefault();runSearch(true);});
}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
