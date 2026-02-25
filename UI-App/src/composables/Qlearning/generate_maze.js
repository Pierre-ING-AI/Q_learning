const generate_maze =()=>{
    const rows = 20;
    const cols = 35;
    let maze_tab =[...Array(rows)].map(e => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        console.log(rows);
        for (let j = 0; j < cols; j++) {
            if (i === 0 || i === rows-1  || j === 0 || j === cols-1) {
                maze_tab[i][j] = 1;
            } 
            else{
                const val = Math.floor(Math.random() * 6);
                if(val<=1 && ((i>=5 && i<=(rows-5))||(j>=5 && j<=(cols-5)))){
                    maze_tab[i][j] = val;
                }
            }
        }
    }
    maze_tab[rows-2][cols-2] = 2;
    // this.$emit('update:maze',maze_tab);
    return maze_tab;
}
export default generate_maze;