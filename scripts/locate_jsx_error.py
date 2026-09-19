from pathlib import Path

line = Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx').read_text().splitlines()[245]
position = 9614
print('line_length=', len(line))
print(line[max(0, position - 500): position + 500])
