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
if(search){
  const cards=[...document.querySelectorAll('.category-card')];
  search.addEventListener('input',()=>{
    const q=search.value.trim().toLowerCase();
    cards.forEach(card=>{
      card.classList.toggle('hidden',q && !card.textContent.toLowerCase().includes(q));
    });
  });
}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
