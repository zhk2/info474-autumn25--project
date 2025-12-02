import pandas as pd
import numpy as np

df = pd.read_csv("UN_2024_map.csv")

df3 = df[['reporterDesc', 'partnerDesc', 'primaryValue', 'flowCode']]
df3 = df3[df3['reporterDesc'] != "World"]
df3 = df3[df3['partnerDesc'] != "World"]
df3 = df3[df3['flowCode'] == "M"]
df3['primaryValue'] = np.floor(df3['primaryValue']).astype(int)

df3.to_csv("file.csv", index=True)